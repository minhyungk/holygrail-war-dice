// 스킬 자동 발동 (skills.md §9, D-142). 효과량은 constants skill.* [임시값]을 그대로 읽는다.
import { describe, expect, it } from 'vitest';
import { K, SKILLS } from '../data/constants';
import { HASSAN, runData, scriptedDice, servant, servantIds, SV } from '../testkit';
import { type BattleDice, createFighter, type Fighter, type Policy, runBattle } from './combat';
import { whenOk } from './skills';
import { EventLog } from './events';

const data = runData();
const fighter = (faction: string, id: string, o: Partial<Fighter> = {}) =>
  createFighter(faction, servant(id), o.controller ?? 'ai', { mana: 0, seals: 0, fatePoints: 0, skills: data.skills[id]!.skills, ...o });
const policy: Policy = (p) => (p.kind === 'phase_command' ? 'none' : p.kind === 'danger_decision' ? 'fight' : false);
const TIES = [7, 7, 7, 7, 7, 7];
/** 개활지 추첨값: 정면 0~49, 선제 50~69, 마술전 70~89, 즉사 90~99. 공격측 0 = a */
const DRAW = { clash: 0, initiative: 55, sorcery: 75, fate: 95 };

/** 앞부분만 정해 둔 주사위. 이후 굴림은 7, 추첨은 n-1 (확률 판정은 일어나지 않고, 지형 추첨은 마지막 후보: 즉사 수단이 있으면 즉사/우연, 없으면 마술전) */
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
    const owned = Object.values(SV).flatMap((id) => data.skills[id]!.skills.map((s) => s.skill_id));
    expect(owned).toHaveLength(43);
    for (const id of owned) expect(SKILLS[id], id).toBeDefined();
  });
  it('편입 서번트 전원의 보유 스킬이 정의돼 있다 (D-157 자동 배정 포함)', () => {
    for (const id of servantIds()) for (const s of data.skills[id]!.skills) expect(SKILLS[s.skill_id], `${id} ${s.skill_id}`).toBeDefined();
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

  it('대마력: 상대가 캐스터면 정면 격돌에서도 발동한다 (D-156)', () => {
    const r = fight(fighter('fc_a', SV.artoria), fighter('fc_c', SV.medea), TIES, [DRAW.clash, 0, DRAW.clash, 0, DRAW.clash, 0]);
    const artoria = r.log.ofType('phase_rolled')[0]!.data.rolls.find((x) => x.faction === 'fc_a')!;
    expect(r.log.ofType('phase_started')[0]!.data.phase_id).toBe('ph_clash');
    expect(artoria.parts.sk_magic_resistance).toBe(K['skill.rank_amount'].major.A);
  });
  it('대마력: 캐스터가 아닌 상대와의 정면 격돌에서는 발동하지 않는다', () => {
    const r = fight(fighter('fc_a', SV.artoria), fighter('fc_c', SV.cu), TIES, [DRAW.clash, 0, DRAW.clash, 0, DRAW.clash, 0]);
    expect(r.skills.some((s) => s.skill_id === 'sk_magic_resistance')).toBe(false);
  });

  it('마안 A+: 선제/회피에서 공격측 메두사가 방어측 판정을 깎는다 (foe:, D-163)', () => {
    const r = fight(fighter('fc_m', SV.medusa), fighter('fc_a', SV.artoria), TIES, [DRAW.initiative, 0, DRAW.clash, 0, DRAW.clash, 0]);
    expect(r.log.ofType('phase_started')[0]!.data).toMatchObject({ phase_id: 'ph_initiative', attacker: 'fc_m' });
    const roll = r.log.ofType('phase_rolled')[0]!.data.rolls.find((x) => x.faction === 'fc_a')!;
    expect(roll.parts['foe:sk_mystic_eyes']).toBe(-K['skill.rank_amount'].major.A);
    expect(r.skills[0]).toMatchObject({ faction: 'fc_m', skill_id: 'sk_mystic_eyes', target: 'fc_a', effect: 'roll_mod' });
  });

  it('굴리지 않는 쪽의 보정은 발동하지 않는다: 즉사/우연에서 공격측 하산의 투척/회수 (R11)', () => {
    // 하산·쿠 훌린 모두 즉사 수단이 있어 공격측을 추첨한다 (0 = a = 하산)
    const r = fight(fighter('fc_h', HASSAN), fighter('fc_c', SV.cu), TIES, [DRAW.fate, 0, DRAW.clash, 0, DRAW.clash, 0]);
    expect(r.log.ofType('phase_started')[0]!.data).toMatchObject({ phase_id: 'ph_fate', attacker: 'fc_h' });
    expect(SKILLS.sk_throw_retrieve).toMatchObject({ when: { phase: ['ph_fate'] } });
    expect(r.skills.filter((s) => s.phase_index === 1 && s.faction === 'fc_h')).toHaveLength(0);
  });

  it('단독행동: 음수 호감도 보정을 무시한다', () => {
    const r = fight(fighter('fc_e', SV.emiya, { controller: 'player', bonus: { affinity: -2 } }), fighter('fc_c', SV.cu), TIES, [DRAW.clash, 0, DRAW.clash, 0, DRAW.clash, 0]);
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

describe('스킬 특공 foe_trait (D-162)', () => {
  const ctx = (foeTraits: number[]) => ({ phaseIndex: 1, selfCondition: 'full' as const, leyline: false, foeClass: 'saber', foeTraits, phase: 'ph_clash' as const });
  it('상대가 그 특성 중 하나를 가지면 발동, 없으면 발동하지 않는다', () => {
    expect(whenOk({ phase: ['ph_clash'], foe_trait: [2000] }, ctx([1, 2000]))).toBe(true);
    expect(whenOk({ phase: ['ph_clash'], foe_trait: [2000] }, ctx([1, 2001]))).toBe(false);
  });
  it('자동 배정: 신성 특공 스킬(천하포무)은 foe_trait 2000(divine)', () => {
    expect(SKILLS.sk_unifying_the_nation_by_force).toMatchObject({ when: { foe_trait: [2000] } });
  });
});
