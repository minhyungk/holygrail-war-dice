"""서술 엔진 프로토타입 (문서 규칙 그대로, 데모용). narrative-engine.md §6, §7, §8 기준.
대본으로 정한 이벤트를 흘려보내고, 데이터 파일에서 대사·나레이션을 골라 출력한다."""
import json, glob, random, sys

import os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SEED = int(sys.argv[1]) if len(sys.argv) > 1 else 6
rng = random.Random(SEED)
TRACE = '--trace' in sys.argv

CLASS_KO = {'saber': '세이버', 'lancer': '랜서', 'archer': '아처', 'rider': '라이더', 'caster': '캐스터', 'assassin': '어새신', 'berserker': '버서커'}
SV = {}
for f in glob.glob(f'{ROOT}/data/servants/*/profile.json'):
    p = json.load(open(f, encoding='utf-8')); SV[p['servant_id']] = p
DLG = {json.load(open(f, encoding='utf-8'))['speaker']: json.load(open(f, encoding='utf-8'))
       for f in glob.glob(f'{ROOT}/data/servants/*/dialogue.json')}
NAR = json.load(open(f'{ROOT}/data/common/narrator.json', encoding='utf-8'))

said = set()      # repeat 추적
STEPS = []        # 목업 내보내기용
PLAYER = 'sv_0002_artoria'
intel = {}        # 플레이어가 아는 정보 단계 (servant_id → 0~3)

def known(sid): return 3 if sid == PLAYER else intel.get(sid, 0)
def display(sid):
    k = known(sid)
    if k == 0: return '정체불명의 서번트'
    if k < 3: return CLASS_KO[SV[sid]['class']]
    return SV[sid]['name_ko']

def batchim(word):
    c = word.strip()[-1]
    if not ('가' <= c <= '힣'): return None
    return (ord(c) - 0xAC00) % 28
def josa(word, pair):
    a, b = pair.split('/')
    j = batchim(word)
    if pair == '으로/로': return '로' if j in (0, 8) else '으로'
    return a if j else b

def render(text, names):
    import re
    def rep(m):
        key, jp = m.group(1), m.group(2)
        w = names[key]
        return w + (josa(w, jp) if jp else '')
    out = re.sub(r'\{(servant|enemy|actor|target|winner|loser)\}(?:\{([^}]+/[^}]+)\})?', rep, text)
    return out.replace('[image berserker_language_1]', '■■■■■')

def ok(cond, val):
    if isinstance(cond, dict):
        if 'in' in cond: return val in cond['in']
        if 'gte' in cond: return val is not None and val >= cond['gte']
        if 'lt' in cond: return val is not None and val < cond['lt']
        if 'not' in cond: return val != cond['not']
    return val == cond

def pick(pool, facts, why):
    cands = []
    for l in pool:
        w = l.get('when') or {}
        if all(ok(c, facts.get(k)) for k, c in w.items()):
            rp = l.get('repeat', 'always')
            if rp == 'once_per_run' and l['_key'] in said: continue
            cands.append((len(w), l))
    if not cands:
        if TRACE: print(f'      · [{why}] 후보 없음 → 생략')
        return None
    top = max(s for s, _ in cands)
    best = [l for s, l in cands if s == top]
    choice = rng.choices(best, weights=[l.get('weight', 1) for l in best])[0]
    said.add(choice['_key'])
    if TRACE: print(f'      · [{why}] 후보 {len(cands)} → 최고 점수 {top} ({len(best)}개) → {choice["_key"]}')
    return choice

def pool_lines(sid, tag):
    out = []
    for l in DLG[sid]['tags'].get(tag, []):
        if l.get('speaker') == 'narrator': continue
        l = dict(l); l['_key'] = f'{sid}/{tag}/{l["id"]}'; out.append(l)
    return out
def pool_nar(tag, slot):
    out = []
    for l in NAR['tags'].get(tag, []):
        if l.get('slot') == slot:
            l = dict(l); l['_key'] = f'narrator/{tag}/{l["id"]}'; out.append(l)
    return out

def facts_for(speaker, other, world, event, beat=None, extra=None):
    f = {}
    if speaker:
        f.update({'self.servant': speaker, 'self.intel_level': known(speaker)})
        f.update(extra.get(speaker, {}) if extra else {})
    if other:
        f.update({'enemy.servant': other, 'enemy.intel_level': known(other)})
    f.update({f'world.{k}': v for k, v in world.items()})
    f.update({f'event.{k}': v for k, v in event.items()})
    if beat: f.update({f'beat.{k}': v for k, v in beat.items()})
    return f

CAP = {'big': 6, 'normal': 4, 'small': 2}
def emit(title, items, size='normal'):
    """items: [(speaker_sid or None, line)] in 출력 순서. 템포 상한 적용 (§8.5)."""
    items = [(s, l, n) for s, l, n in items if l]
    # 나레이션 연속 상한 2: 가장 덜 구체적인 나레이션부터 제거
    while True:
        run, worst = 0, None
        for i, (s, l, n) in enumerate(items):
            if s is None:
                run += 1
                if run > 2:
                    seg = [j for j in range(i - run + 1, i + 1)]
                    worst = min(seg, key=lambda j: len(items[j][1].get('when') or {}))
                    break
            else: run = 0
        if worst is None: break
        if TRACE: print(f'      · 나레이션 연속 상한 → {items[worst][1]["_key"]} 생략')
        items.pop(worst)
    while len(items) > CAP[size]:
        for slot in ('tail', 'react', 'lead'):
            idx = [i for i, (s, l, n) in enumerate(items) if s is None and l.get('slot') == slot]
            if idx: items.pop(idx[-1]); break
        else: break
    print(f'\n  ─── {title}')
    STEPS.append({'type': 'beat', 'title': title, 'size': size, 'lines': [
        {'who': None if s is None else display(s), 'sid': s, 'text': ' '.join(render(l['text'], n).split())} for s, l, n in items]})
    for s, l, names in items:
        text = render(l['text'], names)
        if s is None: print(f'  {text}')
        else: print(f'  {display(s)}: “{text}”')

def names_for(speaker, other, **kw):
    n = {'servant': display(speaker) if speaker else '', 'enemy': display(other) if other else ''}
    for k, v in kw.items(): n[k] = display(v)
    return n

# ─────────────────────────── 대본 ───────────────────────────
A, C, H, M = 'sv_0002_artoria', 'sv_0017_cu_chulainn', 'sv_0047_heracles', 'sv_0031_medea'
aff = {A: {'self.affinity_tier': 'neutral', 'self.condition': 'full'}}

print(f'[시드 {SEED}] 플레이어: 알트리아 / 적: 쿠 훌린(랜서), 헤라클레스, 메데이아 …')

# 1일차 낮
w = {'day': 1, 'time': 'day', 'terrain': 'urban'}
emit('1일차 아침', [(None, pick(pool_nar('day_started', 'lead'), facts_for(None, None, w, {}), 'lead'), {})])

w = {'day': 1, 'time': 'day', 'terrain': 'river'}
f = facts_for(A, None, w, {}, extra=aff)
line = pick(pool_lines(A, 'day_bond'), f, 'line')
bf = facts_for(A, None, w, {}, {'line.tone': line.get('tone') if line else None, 'has_line': bool(line)}, extra=aff)
lead = pick(pool_nar('day_bond', 'lead'), bf, 'lead')
react = pick(pool_nar('day_bond', 'react'), bf, 'react')
emit('낮 행동 1: 서번트 교류 (미온강 강변)', [(None, lead, {}), (A, line, names_for(A, None)), (None, react, {})])

w = {'day': 1, 'time': 'day', 'terrain': 'urban'}
intel[C] = 1
ev = {'result': 'success', 'intel_level': 1}
f = facts_for(A, C, w, ev, extra=aff)
line = pick(pool_lines(A, 'intel'), f, 'line')
lead = pick(pool_nar('intel', 'lead'), f, 'lead')
emit('낮 행동 2: 정보 수집 → 랜서의 클래스 판명', [(None, lead, {}), (A, line, names_for(A, C))])

# 1일차 밤
w = {'day': 1, 'time': 'night', 'terrain': 'river'}
emit('1일차 밤', [(None, pick(pool_nar('night_started', 'lead'), facts_for(A, None, w, {}, extra=aff), 'lead'), {})], 'small')

# 조우 → 전투 개시 (대사 먼저, 나레이션이 따라감)
ev = {}
fA = facts_for(A, C, w, ev, extra=aff); fA['mem.met_before'] = False
line = pick(pool_lines(A, 'battle_start'), fA, 'line (알트리아)')
fC = facts_for(C, A, w, ev); fC['mem.met_before'] = False
ans = pick(pool_lines(C, 'battle_start'), fC, 'answer (랜서)')
bf = facts_for(A, C, w, ev, {'line.tone': line.get('tone'), 'has_line': True}, extra=aff)
bf['scene.setting_told'] = False; bf['mem.released'] = False
lead1 = pick(pool_nar('battle_start', 'lead'), {**bf, 'enemy.intel_level': None}, 'lead (장소)')
lead2 = pick([l for l in pool_nar('battle_start', 'lead') if 'world.terrain' not in (l.get('when') or {})], bf, 'lead (상대 등장)')
react = pick(pool_nar('battle_start', 'react'), bf, 'react')
tail = pick(pool_nar('battle_start', 'tail'), bf, 'tail')
emit('조우: 강변, 랜서와 마주침 (큰 비트)', [(None, lead1, {}), (None, lead2, names_for(A, C)), (A, line, names_for(A, C)),
                                            (C, ans, names_for(C, A)), (None, react, {}), (None, tail, {})], 'big')

def phase(no, pid, roll_a, roll_c, stat_a, stat_c, miracle_a=False):
    va, vc = stat_a + roll_a + (5 if miracle_a else 0), stat_c + roll_c
    winner, loser = (A, C) if va > vc else (C, A)
    margin = abs(va - vc)
    STEPS.append({'type': 'dice', 'no': no, 'phase': pid, 'a': {'stat': stat_a, 'roll': roll_a, 'miracle': miracle_a, 'total': va},
                  'c': {'stat': stat_c, 'roll': roll_c, 'total': vc}, 'winner': 'a' if winner == A else 'c', 'margin': margin})
    print(f'\n  [국면 {no}: {pid}] 알트리아 {stat_a}+{roll_a}{"+5(기적)" if miracle_a else ""}={va} / 랜서 {stat_c}+{roll_c}={vc} → 차이 {margin}')
    return winner, loser, margin

cond = {A: 'full', C: 'full'}
order = ['full', 'hurt', 'danger', 'dead']
def drop(sv, margin):
    i = order.index(cond[sv]) + (2 if margin >= 5 else 1)
    cond[sv] = order[min(i, 3)]
    STEPS.append({'type': 'cond', 'side': 'a' if sv == A else 'c', 'to': cond[sv]})
    return cond[sv]

# 국면 1: 선제/회피 — 랜서 압승
emit('국면 1 시작', [(None, pick(pool_nar('phase_start', 'lead'), facts_for(None, None, w, {'phase_id': 'ph_initiative'}), 'lead'), {})], 'small')
wn, ls, mg = phase(1, 'ph_initiative', 9, 13, 6, 7)
to = drop(ls, mg)
ev = {'phase_id': 'ph_initiative', 'margin': mg, 'result': 'resolved', 'condition_to': to}
react = pick(pool_nar('phase_result', 'react'), facts_for(None, None, w, ev), 'react')
tail = pick(pool_nar('phase_result', 'tail'), facts_for(None, None, w, ev), 'tail')
aff[A]['self.condition'] = to
crisis = pick(pool_lines(A, 'crisis'), facts_for(A, C, w, ev, extra=aff) | {'mem.near_death_count': 0}, 'line (위기)') if ls == A and to == 'danger' else None
emit(f'국면 1 결과: 알트리아 만전 → {to} (큰 비트)', [(None, react, names_for(None, None, winner=wn, loser=ls)),
                                                    (None, tail, names_for(None, None, winner=wn, loser=ls)), (A, crisis, names_for(A, C))], 'big')
if ls == A and to == 'danger': STEPS.append({'type': 'prompt', 'kind': 'crisis'})

# 국면 2: 정면 격돌 — 알트리아 자연값 19 → 기적
emit('국면 2 시작', [(None, pick(pool_nar('phase_start', 'lead'), facts_for(None, None, w, {'phase_id': 'ph_clash'}), 'lead'), {})], 'small')
wn, ls, mg = phase(2, 'ph_clash', 19, 14, 12, 11, miracle_a=True)
to = drop(ls, mg)
ev = {'phase_id': 'ph_clash', 'margin': mg, 'result': 'resolved', 'condition_to': to}
mir = pick(pool_nar('miracle', 'react'), facts_for(None, None, w, ev), 'react (기적)')
react = pick(pool_nar('phase_result', 'react'), facts_for(None, None, w, ev), 'react')
tail = pick(pool_nar('phase_result', 'tail'), facts_for(None, None, w, ev), 'tail')
emit(f'국면 2 결과: 랜서 만전 → {to} (큰 비트)', [(None, mir, names_for(None, None, winner=wn, loser=ls)),
                                                 (None, react, names_for(None, None, winner=wn, loser=ls)),
                                                 (None, tail, names_for(None, None, winner=wn, loser=ls))], 'big')

# 국면 3: 알트리아 보구 개방 (마력 80 → 30) → 일방 보구
STEPS.append({'type': 'prompt', 'kind': 'np'})
STEPS.append({'type': 'mana', 'side': 'a', 'to': 30})
bf = facts_for(A, C, w, {}, {'actor_side': 'self'})
lead = pick(pool_nar('np_open', 'lead'), bf, 'lead')
line = pick(pool_lines(A, 'np_open'), facts_for(A, C, w, {}, extra=aff), 'line (영창)')
react = pick(pool_nar('np_open', 'react'), bf, 'react')
emit('국면 3: 보구 개방 (큰 비트)', [(None, lead, {}), (A, line, names_for(A, C)), (None, react, {})], 'big')
emit('국면 3 시작', [(None, pick(pool_nar('phase_start', 'lead'), facts_for(None, None, w, {'phase_id': 'ph_np_attack'}), 'lead'), {})], 'small')
wn, ls, mg = phase(3, 'ph_np_attack', 10, 6, 8, 5)
print('  → 랜서 `위험`에서 패배. 적 AI는 남은 영주로 도주 (D-051)')
STEPS.append({'type': 'seal', 'side': 'c', 'purpose': 'escape'})
ev = {'phase_id': 'ph_np_attack', 'margin': mg, 'result': 'resolved'}
react = pick(pool_nar('phase_result', 'react'), facts_for(None, None, w, ev), 'react')
end = pick(pool_nar('battle_end', 'tail'), facts_for(None, None, w, {'result': 'escape'}), 'tail (도주)')
emit('국면 3 결과 → 전투 종료: 랜서 영주 도주', [(None, react, names_for(None, None, winner=wn, loser=ls)), (None, end, {})], 'big')

# 2일차 아침: 소문 (헤라클레스가 메데이아를 쓰러뜨림, 플레이어는 둘 다 모름)
aff[A]['self.condition'] = 'hurt'  # 밤이 지나 1단계 회복 (위험 → 부상)
w = {'day': 2, 'time': 'day', 'terrain': 'urban'}
lead = pick(pool_nar('day_started', 'lead'), facts_for(None, None, w, {'rumor': True, 'rumor_known': False}), 'lead (소문)')
emit('2일차 아침 (밤사이 헤라클레스가 메데이아를 쓰러뜨림 — 플레이어는 모름)', [(None, lead, names_for(None, None, loser=M))])

if '--export' in sys.argv:
    json.dump(STEPS, open(sys.argv[sys.argv.index('--export') + 1], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
