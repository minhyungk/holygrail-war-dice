// 전쟁 연대기 (D-166, D-168): 끝난 전쟁의 이벤트 기록에서 주요 사건을 뽑아(buildChronicle) 날짜별 줄글 문단으로 조립한다(composeChronicle).
// 판정은 하지 않고 기록을 읽기만 한다. 문장은 data/common/chronicle.json 틀에서 시드 고정으로 고른다 (LLM 없음).
// 전쟁이 끝난 뒤 보여 주므로 진명을 모두 공개한다 (D-156 전쟁 결산과 같다).
import { TILES } from '../data/constants';
import type { ChronicleFile, Line } from '../data/schema';
import type { AnyEvent, GameEvent, TimeOfDay } from '../engine/events';
import { createRng } from '../engine/rng';
import { type JosaPair, JOSA_PAIRS, josa } from './josa';
import { type Candidate, type Facts, type Memory, pick } from './select';

export type ChronicleKind = 'battle' | 'choice' | 'out' | 'final';

export interface ChronicleItem {
  kind: ChronicleKind;
  /** 사건에 등장하는 진영 (얼굴·이름 표시용) */
  factions: string[];
  /** 전투: 장소 이름 */
  place?: string;
  /** 전투 결과. win이면 winner/loser, 소멸이면 dead */
  result?: 'win' | 'draw' | 'escape' | 'escape_failed';
  winner?: string | null;
  loser?: string | null;
  dead?: string | null;
  escaped?: string | null;
  /** 플레이어가 치른 전투인가 */
  mine?: boolean;
  /** 처치/방면 */
  choice?: 'execute' | 'release';
  /** 탈락 원인·상대 */
  cause?: string;
  by?: string | null;
  /** 전투: 이 전투에서 보구를 연 진영 */
  np?: string[];
}

export interface ChronicleSection {
  day: number;
  time: TimeOfDay;
  items: ChronicleItem[];
}

const tileName = (id: string | null | undefined) => (id ? (TILES.find((t) => t.tile_id === id)?.name_ko ?? id) : undefined);

export function buildChronicle(events: readonly AnyEvent[], player: string): ChronicleSection[] {
  const sections: ChronicleSection[] = [];
  const started = new Map<string, GameEvent<'battle_started'>>();
  const opened = new Map<string, string[]>();
  const push = (e: AnyEvent, item: ChronicleItem) => {
    const last = sections.at(-1);
    if (last && last.day === e.day && last.time === e.time) last.items.push(item);
    else sections.push({ day: e.day, time: e.time, items: [item] });
  };
  for (const e of events) {
    switch (e.type) {
      case 'battle_started':
        started.set(e.data.battle_id, e as GameEvent<'battle_started'>);
        break;
      case 'final_started':
        push(e, { kind: 'final', factions: [...e.data.factions], place: tileName(e.data.tile) });
        break;
      case 'np_opened':
        opened.set(e.data.battle_id, [...(opened.get(e.data.battle_id) ?? []), e.data.faction]);
        break;
      case 'battle_ended': {
        // 플레이어 전투와 적끼리 전투 모두. 탈락(eliminated)은 이 뒤에 기록된다
        const s = started.get(e.data.battle_id);
        if (!s) break;
        push(e, { kind: 'battle', mine: s.data.sides.includes(player), factions: [...s.data.sides], place: tileName(s.data.tile), result: e.data.result, winner: e.data.winner, loser: e.data.loser, dead: e.data.dead, escaped: e.data.escaped, np: opened.get(e.data.battle_id) ?? [] });
        break;
      }
      case 'post_choice':
        push(e, { kind: 'choice', factions: [e.data.faction, e.data.target], choice: e.data.choice });
        break;
      case 'eliminated':
        push(e, { kind: 'out', factions: [e.data.faction], cause: e.data.cause, by: e.data.by });
        break;
    }
  }
  return sections;
}

// ── 줄글 조립 (D-168) ──

/** 문단 조각: 글, 또는 서번트 이름(얼굴을 붙일 수 있다) */
export type ChronicleSeg = { k: 'text'; v: string } | { k: 'name'; fc: string; v: string; face: boolean };
export interface ChronicleSentence {
  segs: ChronicleSeg[];
  /** 플레이어 진영이 치른 사건 (화면 강조) */
  mine: boolean;
}
export interface ChronicleParagraph {
  heading: string;
  sentences: ChronicleSentence[];
}

/** 화면이 넘겨 주는 이름표. 서술 모듈은 표시 규칙을 모른다 */
export interface ChronicleNames {
  servant: (fc: string) => string;
  cls: (fc: string) => string;
  /** 플레이어 진영이면 null (틀의 master_fallback을 쓴다) */
  master: (fc: string) => string | null;
}

/** 같은 밤 같은 두 진영의 연속 전투를 한 문장으로 묶은 것 */
interface BattleGroup {
  battles: ChronicleItem[];
  outs: ChronicleItem[];
  meeting: number;
  firstBlood: boolean;
}

const pairKey = (a: string, b: string) => [a, b].sort().join('|');

export function composeChronicle(
  events: readonly AnyEvent[],
  player: string,
  file: ChronicleFile,
  names: ChronicleNames,
  seed: number,
  winner: string | null,
): ChronicleParagraph[] {
  const L = file.labels;
  const rng = createRng(seed);
  const mem: Memory = { said: new Map(), beat: 0, lastInPool: new Map() };
  const meetings = new Map<string, number>();
  let bloodSpilled = false;

  const pickLine = (tag: keyof ChronicleFile['tags'], facts: Facts): Line | null => {
    const cands: Candidate[] = file.tags[tag].map((line) => ({ line: { ...file.defaults, ...line }, textId: `tx_chronicle_${tag}_${line.id}`, layer: 2, speaker: 'narrator' }));
    mem.beat += 1;
    return pick(cands, facts, mem, rng, `chronicle:${tag}`)?.line ?? null;
  };
  const numWord = (list: readonly string[], n: number) => list[n - 1] ?? String(n);
  const ordinal = (n: number) => (n <= L.ordinals.length ? L.ordinal.replace('{word}', numWord(L.ordinals, n)) : L.ordinal_big.replace('{n}', String(n)));
  const dayName = (d: number) => numWord(L.day_names, d);

  /** 틀 채우기: {이름}{조사}. 서번트 이름은 문단에서 처음 나올 때만 얼굴을 붙인다 */
  const fill = (text: string, vals: Record<string, string | { fc: string } | { list: string[] }>, seen: Set<string>): ChronicleSeg[] => {
    const segs: ChronicleSeg[] = [];
    const push = (v: string) => {
      const last = segs.at(-1);
      if (last?.k === 'text') last.v += v;
      else segs.push({ k: 'text', v });
    };
    const nameSeg = (fc: string) => {
      segs.push({ k: 'name', fc, v: names.servant(fc), face: !seen.has(fc) });
      seen.add(fc);
    };
    const re = /\{([a-z_]+)\}(\{([^}]+)\})?/g;
    let at = 0;
    for (const m of text.matchAll(re)) {
      push(text.slice(at, m.index));
      at = m.index + m[0].length;
      const key = m[1]!;
      const pair = m[3] as JosaPair | undefined;
      const v = vals[key];
      let spoken = '';
      if (v === undefined) spoken = '';
      else if (typeof v === 'string') (push(v), (spoken = v));
      else if ('fc' in v) (nameSeg(v.fc), (spoken = names.servant(v.fc)));
      else {
        v.list.forEach((fc, i) => {
          if (i) push(', ');
          nameSeg(fc);
        });
        spoken = v.list.length ? names.servant(v.list.at(-1)!) : '';
      }
      if (pair && (JOSA_PAIRS as readonly string[]).includes(pair)) push(josa(spoken, pair));
      else if (m[2]) push(m[2]);
    }
    push(text.slice(at));
    // 빈 값(예: 이름에 이미 클래스가 들어 있어 비운 클래스) 때문에 생긴 겹친 공백을 하나로
    for (const g of segs) if (g.k === 'text') g.v = g.v.replace(/ {2,}/g, ' ').replace(/^ (?=[,.])/, '');
    return segs.filter((g) => g.k !== 'text' || g.v !== '');
  };
  /** 이름 앞 클래스. '우미인 랜서'처럼 이름에 클래스가 이미 들어 있으면 비운다 */
  const classBefore = (fc: string) => (names.servant(fc).includes(names.cls(fc)) ? '' : names.cls(fc));
  const masterName = (fc: string) => names.master(fc) ?? L.master_fallback.replace('{servant}', names.servant(fc));

  const groupSentences = (g: BattleGroup, final: boolean, seen: Set<string>): ChronicleSentence[] => {
    const last = g.battles.at(-1)!;
    const [a, b] = last.factions as [string, string];
    const np = new Set(g.battles.flatMap((x) => x.np ?? []));
    const other = (fc: string | null | undefined) => (fc === a ? b : a);
    const npFact =
      last.result === 'win'
        ? np.has(last.winner!) && np.has(last.loser!) ? 'both' : np.has(last.winner!) ? 'winner' : np.has(last.loser!) ? 'loser' : 'none'
        : last.result === 'escape'
          ? np.has(last.escaped!) && np.has(other(last.escaped)) ? 'both' : np.has(last.escaped!) ? 'escaped' : np.has(other(last.escaped)) ? 'other' : 'none'
          : np.size >= 2 ? 'both' : np.size === 1 ? 'one' : 'none';
    const facts: Facts = {
      'event.result': last.result,
      'event.dead': !!last.dead,
      'event.np': npFact,
      'event.rematch': g.battles.length > 1,
      'event.meeting': g.meeting,
      'event.first_blood': g.firstBlood,
      'event.final': final,
    };
    const mine = last.factions.includes(player);
    const out: ChronicleSentence[] = [];
    const line = pickLine('battle', facts);
    if (line) {
      const escaper = last.escaped ?? (last.result === 'escape_failed' ? last.dead : null);
      out.push({
        mine,
        segs: fill(line.text, {
          place: last.place ?? '',
          a: { fc: a },
          b: { fc: b },
          ...(last.winner ? { winner: { fc: last.winner } } : last.dead ? { winner: { fc: other(last.dead) } } : {}),
          ...(last.loser ? { loser: { fc: last.loser } } : last.dead ? { loser: { fc: last.dead } } : {}),
          ...(last.dead ? { dead: { fc: last.dead } } : {}),
          ...(escaper ? { escaped: { fc: escaper }, other: { fc: other(escaper) } } : {}),
          ...(np.size === 1 ? { opener: { fc: [...np][0]! }, rival: { fc: other([...np][0]!) } } : {}),
          n: ordinal(g.meeting),
          times: numWord(L.counts, g.battles.length),
        }, seen),
      });
    }
    for (const o of g.outs) {
      // 전투 문장이 이미 소멸을 말했으면 격파·도주 실패는 덧붙이지 않는다
      if ((o.cause === 'killed' || o.cause === 'escape_failed') && last.dead === o.factions[0]) continue;
      out.push(...outSentence(o, mine, seen));
    }
    return out;
  };
  const outSentence = (o: ChronicleItem, mine: boolean, seen: Set<string>): ChronicleSentence[] => {
    const fc = o.factions[0]!;
    const ol = pickLine('out', { 'event.cause': o.cause });
    return ol ? [{ mine: mine || fc === player, segs: fill(ol.text, { servant: { fc }, master: masterName(fc) }, seen) }] : [];
  };

  const paragraphs: ChronicleParagraph[] = [];
  let lastSeen = new Set<string>();
  const sections = buildChronicle(events, player);
  // 교착: 탈락이 없는 밤이 둘 이상 이어지면 한 문단으로 묶는다
  const quiet = (s: ChronicleSection) => s.time === 'night' && !s.items.some((i) => i.kind === 'out');
  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i]!;
    let secs = [sec];
    let heading: string;
    const seen = new Set<string>();
    const sentences: ChronicleSentence[] = [];
    if (sec.time === 'final') heading = L.heading_final;
    else if (quiet(sec) && quiet(sections[i + 1] ?? sec) && sections[i + 1]) {
      let j = i;
      while (sections[j + 1] && quiet(sections[j + 1]!)) j++;
      secs = sections.slice(i, j + 1);
      heading = L.heading_range.replace('{from}', dayName(sec.day)).replace('{to}', dayName(sections[j]!.day));
      const lead = pickLine('stalemate', {});
      if (lead) sentences.push({ mine: false, segs: fill(lead.text, {}, seen) });
      i = j;
    } else heading = (sec.time === 'day' ? L.heading_day : L.heading_night).replace('{day}', dayName(sec.day));

    for (const s of secs) {
      let group: BattleGroup | null = null;
      const flush = () => {
        if (group) sentences.push(...groupSentences(group, s.time === 'final', seen));
        group = null;
      };
      for (const it of s.items) {
        if (it.kind === 'final') {
          flush();
          const lead = pickLine('final', {});
          if (lead) sentences.push({ mine: it.factions.includes(player), segs: fill(lead.text, { place: it.place ?? '', count: numWord(L.counts, it.factions.length), list: { list: it.factions } }, seen) });
        } else if (it.kind === 'battle') {
          const key = pairKey(it.factions[0]!, it.factions[1]!);
          meetings.set(key, (meetings.get(key) ?? 0) + 1);
          const g = group as BattleGroup | null;
          const prev = g?.battles.at(-1);
          if (g && prev && !g.outs.length && pairKey(prev.factions[0]!, prev.factions[1]!) === key) g.battles.push(it);
          else {
            flush();
            group = { battles: [it], outs: [], meeting: 0, firstBlood: false };
          }
          const cur = group as unknown as BattleGroup;
          cur.meeting = meetings.get(key)!;
          if (it.dead && !bloodSpilled) (cur.firstBlood = true), (bloodSpilled = true);
        } else if (it.kind === 'out') {
          const g = group as BattleGroup | null;
          if (g && g.battles.at(-1)!.factions.includes(it.factions[0]!)) g.outs.push(it);
          else {
            flush();
            sentences.push(...outSentence(it, false, seen));
          }
        }
        // 처치/방면 선택(choice)은 뒤따르는 탈락(out)이 같은 내용을 말한다
      }
      flush();
    }
    if (sentences.length) (paragraphs.push({ heading, sentences }), (lastSeen = seen));
  }

  // 마무리: 승자 한 줄
  const closing = pickLine('closing', { 'event.has_winner': !!winner, 'event.player_won': winner === player });
  if (closing) {
    // 마지막 문단에 이어 붙이므로 그 문단에서 이미 얼굴을 보인 이름은 다시 붙이지 않는다
    const last = paragraphs.at(-1);
    const s: ChronicleSentence = {
      mine: winner === player,
      segs: fill(closing.text, winner ? { winner: { fc: winner }, class: classBefore(winner), winner_master: masterName(winner) } : {}, last ? lastSeen : new Set()),
    };
    if (last) last.sentences.push(s);
    else paragraphs.push({ heading: L.heading_final, sentences: [s] });
  }
  return paragraphs;
}
