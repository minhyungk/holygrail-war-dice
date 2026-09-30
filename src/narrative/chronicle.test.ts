// 전쟁 연대기 예시 (D-166, 02-screens-flow.md S6/S7)
import { describe, expect, it } from 'vitest';
import { EventLog } from '../engine/events';
import { buildChronicle } from './chronicle';

describe('전쟁 연대기 (D-166)', () => {
  it('날짜·시간대로 묶고, 전투에 보구 개방을 붙이고, 탈락은 전투 뒤에 적는다', () => {
    const log = new EventLog({ day: 1, time: 'night', action: 1 });
    log.emit('battle_started', ['fc_a', 'fc_b'], { battle_id: 'bt_001', tile: 'tl_r2c2', terrain: 'river', is_final: false, ambusher: null, sides: ['fc_a', 'fc_b'], underdog: null });
    log.emit('np_opened', ['fc_b'], { battle_id: 'bt_001', phase_index: 2, faction: 'fc_b', seal: false, mana_before: 80, mana_after: 0 });
    log.emit('battle_ended', ['fc_a', 'fc_b'], { battle_id: 'bt_001', result: 'win', winner: 'fc_b', loser: 'fc_a', dead: 'fc_a', escaped: null, phases: 3 });
    log.emit('eliminated', ['fc_a'], { faction: 'fc_a', cause: 'killed', by: 'fc_b' });
    log.clock = { day: 2, time: 'night', action: 1 };
    log.emit('battle_started', ['fc_p', 'fc_b'], { battle_id: 'bt_002', tile: 'tl_r1c1', terrain: 'urban', is_final: false, ambusher: null, sides: ['fc_p', 'fc_b'], underdog: 'fc_p' });
    log.emit('battle_ended', ['fc_p', 'fc_b'], { battle_id: 'bt_002', result: 'win', winner: 'fc_p', loser: 'fc_b', dead: null, escaped: null, phases: 3 });
    log.emit('post_choice', ['fc_p', 'fc_b'], { faction: 'fc_p', target: 'fc_b', choice: 'release' });
    log.emit('eliminated', ['fc_b'], { faction: 'fc_b', cause: 'released', by: 'fc_p' });

    const ch = buildChronicle(log.events, 'fc_p');
    expect(ch.map((s) => [s.day, s.time, s.items.map((i) => i.kind)])).toEqual([
      [1, 'night', ['battle', 'out']],
      [2, 'night', ['battle', 'choice', 'out']],
    ]);
    expect(ch[0]!.items[0]).toMatchObject({ mine: false, np: ['fc_b'], winner: 'fc_b', dead: 'fc_a' });
    expect(ch[1]!.items[0]).toMatchObject({ mine: true, np: [], winner: 'fc_p', dead: null });
    expect(ch[1]!.items[1]).toMatchObject({ choice: 'release', factions: ['fc_p', 'fc_b'] });
  });

  it('사건이 없으면 빈 목록', () => expect(buildChronicle([], 'fc_p')).toEqual([]));
});

// ── 줄글 조립 (D-168) ──
import rawChronicle from '../../data/common/chronicle.json';
import { ChronicleFile } from '../data/schema';
import { masterIds, runData, servantIds } from '../testkit';
import { simulateRun } from '../engine/sim';
import { composeChronicle, type ChronicleParagraph } from './chronicle';

const file = ChronicleFile.parse(rawChronicle);
const NAMES: Record<string, string> = { fc_a: '가웨인', fc_b: '마르타', fc_c: '대흑천', fc_p: '오베론' };
const names = { servant: (fc: string) => NAMES[fc] ?? fc, cls: () => '세이버', master: (fc: string) => (fc === 'fc_p' ? null : `${NAMES[fc]}의 주인`) };
const plain = (ps: ChronicleParagraph[]) => ps.map((p) => `[${p.heading}] ${p.sentences.map((s) => s.segs.map((g) => g.v).join('')).join(' ')}`);

describe('줄글 연대기 (D-168)', () => {
  const battle = (log: EventLog, id: string, a: string, b: string, end: { result: 'win' | 'draw' | 'escape'; winner?: string; loser?: string; dead?: string; escaped?: string }) => {
    log.emit('battle_started', [a, b], { battle_id: id, tile: 'tl_r2c2', terrain: 'river', is_final: false, ambusher: null, sides: [a, b], underdog: null });
    log.emit('battle_ended', [a, b], { battle_id: id, result: end.result, winner: end.winner ?? null, loser: end.loser ?? null, dead: end.dead ?? null, escaped: end.escaped ?? null, phases: 3 });
  };
  it('첫 피 · 교착 묶음 · 같은 쌍의 대결 횟수 · 얼굴은 문단 첫 등장만 · 승자 마무리', () => {
    const log = new EventLog({ day: 1, time: 'night', action: 1 });
    battle(log, 'bt_1', 'fc_c', 'fc_a', { result: 'win', winner: 'fc_a', loser: 'fc_c', dead: 'fc_c' });
    log.emit('eliminated', ['fc_c'], { faction: 'fc_c', cause: 'executed', by: 'fc_a' });
    for (const [day, id] of [[2, 'bt_2'], [3, 'bt_3']] as const) {
      log.clock = { day, time: 'night', action: 1 };
      battle(log, id, 'fc_a', 'fc_b', { result: 'draw' });
    }
    log.clock = { day: 4, time: 'night', action: 1 };
    battle(log, 'bt_4', 'fc_b', 'fc_a', { result: 'win', winner: 'fc_a', loser: 'fc_b', dead: 'fc_b' });
    log.emit('eliminated', ['fc_b'], { faction: 'fc_b', cause: 'killed', by: 'fc_a' });

    const ps = composeChronicle(log.events, 'fc_p', file, names, 1, 'fc_a');
    const text = plain(ps);
    expect(ps.map((p) => p.heading)).toEqual(['첫째 밤', '둘째 밤부터 셋째 밤까지', '넷째 밤']);
    expect(text.join('\n')).not.toMatch(/[{}]/);
    // 첫 피 문장, 처치된 마스터
    expect(text[0]).toContain('대흑천의 주인');
    // 같은 쌍의 세 번째 대결에서 소멸: 격파(killed)는 전투 문장이 이미 말했으므로 따로 쓰지 않는다
    expect(ps[2]!.sentences).toHaveLength(2); // 전투 1 + 승자 마무리
    expect(text[2]).toContain('가웨인');
    // 얼굴: 문단마다 처음 나온 이름에만
    for (const p of ps) {
      const faced = p.sentences.flatMap((s) => s.segs).filter((g) => g.k === 'name' && g.face).map((g) => (g as { fc: string }).fc);
      expect(new Set(faced).size).toBe(faced.length);
    }
  });

  it('조사가 받침에 맞게 붙는다 (가웨인은/마르타는)', () => {
    const log = new EventLog({ day: 1, time: 'night', action: 1 });
    battle(log, 'bt_1', 'fc_a', 'fc_b', { result: 'draw' });
    const all = Array.from({ length: 20 }, (_, seed) => plain(composeChronicle(log.events, 'fc_p', file, names, seed, null)).join(' ')).join(' ');
    expect(all).not.toMatch(/가웨인(는|가|를|와)[ ,.]/);
    expect(all).not.toMatch(/마르타(은|이|을|과)[ ,.]/);
  });

  it('시뮬레이션 30판: 빈 자리표시자 없음, 탈락한 서번트는 모두 이름이 나오고, 마지막은 승자 문장', () => {
    const data = runData();
    for (let seed = 1; seed <= 30; seed++) {
      const r = simulateRun({ seed, data, servantIds: servantIds(), masterIds: masterIds() });
      const setup = r.log.ofType('run_started')[0]!.data;
      const sv = (fc: string) => data.servants[setup.factions.find((f) => f.faction === fc)!.servant_id]!;
      const ended = r.log.ofType('run_ended')[0]!.data;
      const ps = composeChronicle(r.log.events, setup.player, file, {
        servant: (fc) => sv(fc).name_short_ko ?? sv(fc).name_ko,
        cls: (fc) => sv(fc).class,
        master: (fc) => (fc === setup.player ? null : data.masters[setup.factions.find((f) => f.faction === fc)!.master_id!]!.name_ko),
      }, seed, ended.winner);
      const body = plain(ps).join('\n');
      expect(body, `${seed}`).not.toMatch(/[{}]/);
      for (const e of r.log.ofType('eliminated')) {
        const mentioned = ps.some((p) => p.sentences.some((s) => s.segs.some((g) => g.k === 'name' && g.fc === e.data.faction)));
        expect(mentioned, `${seed} ${e.data.faction}`).toBe(true);
      }
      if (ended.winner) expect(ps.at(-1)!.sentences.at(-1)!.segs.some((g) => g.k === 'name' && g.fc === ended.winner), `${seed}`).toBe(true);
    }
  });
});

import { CHRONICLE_PLACEHOLDERS, JOSA } from '../data/schema';
describe('연대기 문장 틀 (D-168)', () => {
  it('자리표시자는 목록에 있는 것만, 조사는 {이/가} 형식만', () => {
    const ok = new Set<string>([...CHRONICLE_PLACEHOLDERS, ...JOSA]);
    for (const [tag, lines] of Object.entries(file.tags))
      for (const l of lines) for (const m of l.text.matchAll(/\{([^}]+)\}/g)) expect(ok.has(m[1]!), `${tag}.${l.id}: {${m[1]}}`).toBe(true);
  });
});
