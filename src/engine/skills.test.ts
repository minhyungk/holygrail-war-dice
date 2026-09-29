// 스킬 자동 발동 (skills.md §9, D-142). 효과량은 constants skill.* [임시값]을 그대로 읽는다.
import { describe, expect, it } from 'vitest';
import { K, SKILLS } from '../data/constants';
import { runData, scriptedDice, servant, servantIds, SV } from '../testkit';
import { type BattleDice, createFighter, type Fighter, type Policy, runBattle } from './combat';
import { EventLog } from './events';

const data = runData();
const fighter = (faction: string, id: string, o: Partial<Fighter> = {}) =>
  createFighter(faction, servant(id), o.controller ?? 'ai', { mana: 0, seals: 0, fatePoints: 0, skills: data.skills[id]!.skills, ...o });
const policy: Policy = (p) => (p.kind === 'phase_command' ? 'none' : p.kind === 'danger_decision' ? 'fight' : false);
const TIES = [7, 7, 7, 7, 7, 7];
/** 개활지 추첨값: 정면 0~49, 선제 50~69, 마술전 70~89, 즉사 90~99. 공격측 0 = a */
const DRAW = { clash: 0, sorcery: 75, fate: 95 };

/** 앞부분만 정해 둔 주사위. 이후 굴림은 7, 추첨은 n-1 (확률 판정은 일어나지 않고, 지형 추첨은 즉사/우연) */
function looseDice(rolls: number[], draws: number[]): BattleDice {
  const s = scriptedDice(rolls, draws);
  return {
    roll: () => (s.remaining().rolls ? s.roll() : { dice: [3, 4], natural: 7 }),
    draw: (n) => (s.remaining().draws ? s.draw(n) : n - 1),
  };
}
function fight(a: Fighter, b: Fighter, rolls: number[], draws: number[]) {
  const log = new EventLog();
  const out = runBattle({ battleId: 'bt_skill', terrain: 'open', a, b }, looseDice(rolls, draws), log, policy);
  return { log, out, skills: log.ofType('skill_triggered').map((e) => e.data) };
}

describe('스킬 정의 (D-142)', () => {
  it('시작 7기의 스킬 43개가 모두 정의돼 있다 (전투 효과가 없으면 hook: null과 이유)', () => {
    const owned = servantIds().flatMap((id) => data.skills[id]!.skills.map((s) => s.skill_id));
    expect(owned).toHaveLength(43);
    for (const id of owned) expect(SKILLS[id], id).toBeDefined();
  });
});

describe('판정 보정 (hk_battle_phase_roll)', () => {
  it('대마력 A: 마술전 방어측 +2, 판정 내역에 스킬로 남는다', () => {
    const r = fight(fighter('fc_a', SV.artoria), fighter('fc_c', SV.cu), TIES, [DRAW.sorcery, 1, DRAW.clash, 0, DRAW.clash, 0]);
    const artoria = r.log.ofType('phase_rolled')[0]!.data.rolls.find((x) => x.faction === 'fc_a')!;
    expect(artoria.parts.sk_magic_resistance).toBe(K['skill.rank_amount'].major.A);
    // 발동 기록이 굴림보다 먼저 남는다 (화면에서 먼저 보인다)
    const seqTrig = r.log.ofType('skill_triggered').find((e) => e.data.skill_id === 'sk_magic_resistance')!.seq;
    expect(seqTrig).toBeLessThan(r.log.ofType('phase_rolled')[0]!.seq);
  });

  it('마안 A+: 즉사/우연에서 공격측 메두사가 방어측 판정을 깎는다 (foe:)', () => {
    const r = fight(fighter('fc_m', SV.medusa), fighter('fc_a', SV.artoria), TIES, [DRAW.fate, 0, DRAW.clash, 0, DRAW.clash, 0]);
    const roll = r.log.ofType('phase_rolled')[0]!.data.rolls[0]!;
    expect(roll.faction).toBe('fc_a');
    expect(roll.parts['foe:sk_mystic_eyes']).toBe(-K['skill.rank_amount'].major.A);
    expect(r.skills[0]).toMatchObject({ faction: 'fc_m', skill_id: 'sk_mystic_eyes', target: 'fc_a', effect: 'roll_mod' });
  });

  it('굴리지 않는 쪽의 보정은 발동하지 않는다: 즉사/우연에서 공격측의 카리스마', () => {
    const r = fight(fighter('fc_a', SV.artoria), fighter('fc_c', SV.cu), TIES, [DRAW.fate, 0, DRAW.clash, 0, DRAW.clash, 0]);
    expect(r.skills.filter((s) => s.phase_index === 1 && s.faction === 'fc_a')).toHaveLength(0);
  });

  it('단독행동: 음수 호감도 보정을 무시한다', () => {
    const r = fight(fighter('fc_e', SV.emiya, { controller: 'player', bonus: { affinity: -2, camp: 0 } }), fighter('fc_c', SV.cu), TIES, [DRAW.clash, 0, DRAW.clash, 0, DRAW.clash, 0]);
    const emiya = r.log.ofType('phase_rolled')[0]!.data.rolls.find((x) => x.faction === 'fc_e')!;
    expect(emiya.parts.affinity).toBeUndefined();
    expect(r.skills.some((s) => s.skill_id === 'sk_independent_action' && s.effect === 'event_negate')).toBe(true);
  });

  it('소와의 소양: 상대의 정보 보정을 무효로 한다', () => {
    const r = fight(fighter('fc_p', SV.artoria, { controller: 'player', intelLevel: 3 }), fighter('fc_k', SV.kojiro), TIES, [DRAW.clash, 0, DRAW.clash, 0, DRAW.clash, 0]);
    const mine = r.log.ofType('phase_rolled')[0]!.data.rolls.find((x) => x.faction === 'fc_p')!;
    expect(mine.parts.intel).toBeUndefined();
  });

  it('랭크가 E 이하인 보조 스킬은 0이라 발동하지 않는다 (메두사 신성 E-)', () => {
    expect(K['skill.rank_amount'].minor.E).toBe(0);
  });
});

describe('국면 시작 (hk_battle_phase_select)', () => {
  it('키르케의 가르침: 국면마다 마력 회복, 화면 보기에도 반영할 mana_after를 남긴다', () => {
    const r = fight(fighter('fc_m', SV.medea), fighter('fc_c', SV.cu), TIES, [DRAW.clash, 0, DRAW.clash, 0, DRAW.clash, 0]);
    const circe = r.skills.filter((s) => s.skill_id === 'sk_circes_teaching');
    const step = K['skill.fixed_amount'].sk_circes_teaching!;
    expect(r.out.phases).toBeGreaterThan(1);
    expect(circe.map((s) => s.mana_after)).toEqual(Array.from({ length: r.out.phases }, (_, i) => step * (i + 1)));
    expect(r.out.a.mana).toBe(step * r.out.phases);
  });
});

describe('상태 변화 (hk_battle_condition_change)', () => {
  it('불요불굴: 위험에서 쓰러질 때 1회 버티고, 다음에 지면 쓰러진다', () => {
    const r = fight(fighter('fc_h', SV.heracles, { condition: 'danger' }), fighter('fc_a', SV.artoria), [2, 12, 2, 12], [DRAW.clash, 0, DRAW.clash, 0]);
    const guards = r.skills.filter((s) => s.skill_id === 'sk_battle_continuation');
    expect(guards).toHaveLength(1);
    expect(r.log.ofType('phase_resolved')[0]!.data).toMatchObject({ loser: 'fc_h', condition_from: 'danger', condition_to: 'danger' });
    expect(r.out).toMatchObject({ result: 'win', dead: 'fc_h', phases: 2 });
  });

  it('선혈신전: 상대가 상태 하락하면 마력 흡수', () => {
    const r = fight(fighter('fc_m', SV.medusa), fighter('fc_e', SV.emiya), [12, 2, 7, 7, 7, 7], [DRAW.clash, 0, DRAW.clash, 0, DRAW.clash, 0]);
    const blood = r.skills.find((s) => s.skill_id === 'sk_blood_temple')!;
    expect(blood).toMatchObject({ faction: 'fc_m', amount: K['skill.fixed_amount'].sk_blood_temple, mana_after: K['skill.fixed_amount'].sk_blood_temple });
    const changed = r.log.ofType('condition_changed')[0]!;
    expect(changed.seq).toBeLessThan(r.log.ofType('skill_triggered').find((e) => e.data.skill_id === 'sk_blood_temple')!.seq);
  });
});
