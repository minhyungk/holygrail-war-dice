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
