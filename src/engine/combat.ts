// 3국면 자동 전투 (docs/systems/combat.md, phases.md, dice.md).
// 전투는 제너레이터로 진행한다: 개입 지점(combat.md §4)에서 Prompt를 내보내고 답을 받아 이어 간다.
// UI는 Prompt를 화면에 띄우고, 헤드리스 시뮬은 정책 함수로 답한다 (runBattle).
import { K } from '../data/constants';
import type { PhaseId, ServantProfile, SkillLink, StatId, Terrain } from '../data/schema';
import { check, contest, type NaturalRoll, rollNatural, type RollResult } from './dice';
import type { Condition, EventLog, RollRecord, Side } from './events';
import { phaseDef, phaseFromDraw, phaseFromNp, terrainWeightTotal } from './phases';
import type { Rng } from './rng';
import { type ActiveSkill, type SkillCtx, skillAmount, skillsAt, whenOk } from './skills';
import { manaByRank, miracleNaturals, statSum } from './stats';

export const CONDITIONS: readonly Condition[] = ['full', 'hurt', 'danger']; // D-014

/** 판정에 늘 더해지는 보정 (dice.md §3.3). 스탯·기적·스킬·기습은 전투가 계산한다 */
export interface FixedBonus {
  /** 호감도 보정 (affinity.md §3.4) */
  affinity: number;
  /** 진지 보정 (day-loop.md §13) */
  camp: number;
}
export const NO_BONUS: FixedBonus = { affinity: 0, camp: 0 };

export interface Fighter {
  faction: string;
  servant: ServantProfile;
  /** 플레이어 진영은 개입 지점에서 선택하고, 적 AI는 규칙대로 자동 처리한다 (combat.md §8) */
  controller: 'player' | 'ai';
  condition: Condition;
  mana: number;
  seals: number;
  fatePoints: number;
  bonus: FixedBonus;
  /** 상대에 대한 정보 단계. 보구 공개 시 전투 중에도 갱신된다 (D-137) */
  intelLevel: number;
  /** 명령 거부 확률 (affinity.md §3.4). 적 AI는 0 */
  refusal: number;
  /** 마스터 성향 (적 AI의 퇴각 판단, D-134). 플레이어는 null */
  temperament: string | null;
  /** 보유 스킬 (servants/{id}/skills.json). 훅마다 자동 발동한다 (D-142) */
  skills: readonly SkillLink[];
}

export function createFighter(
  faction: string,
  servant: ServantProfile,
  controller: Fighter['controller'],
  overrides: Partial<Omit<Fighter, 'faction' | 'servant' | 'controller'>> = {},
): Fighter {
  return {
    faction,
    servant,
    controller,
    condition: 'full',
    mana: manaByRank(servant).init,
    seals: K['combat.command_seals'],
    fatePoints: controller === 'player' ? K['dice.fate_point_init'] : 0,
    bonus: NO_BONUS,
    intelLevel: 0,
    refusal: 0,
    temperament: null,
    skills: [],
    ...overrides,
  };
}

/** 공개된 시점부터 같은 엔진으로 이어서 예측한다. 실제 판정 RNG는 넘기지 않는다. */
export interface BattleCheckpoint {
  completed: number;
  npUsed: Record<Side, number>;
  /** 전투당 횟수 제한이 있는 스킬의 사용 횟수 (D-142) */
  skillUses: Record<Side, Record<string, number>>;
  current?: { opened: Record<Side, boolean>; aiDecided: boolean; phase?: { id: PhaseId; attacker: Side } };
}

export interface BattleInput {
  battleId: string;
  captureForecast?: boolean;
  checkpoint?: BattleCheckpoint;
  a: Fighter;
  b: Fighter;
  terrain: Terrain;
  tile?: string | null;
  /** 강제 전투: 국면 제한 없음, 도주 없음 (combat.md §7, D-075) */
  isFinal?: boolean;
  /** 기습에 성공한 쪽. 국면 1의 공격측이 되고 국면 1 판정에 보정을 받는다 (phases.md §3.4, D-099, D-109) */
  ambusher?: Side | null;
}

/** 전투가 쓰는 무작위. 기본은 시드 RNG, 테스트는 정해진 값을 넣는다 */
export interface BattleDice {
  roll(): NaturalRoll;
  /** 0 이상 n 미만 정수 */
  draw(n: number): number;
}
export const rngDice = (rng: Rng): BattleDice => ({ roll: () => rollNatural(rng), draw: (n) => rng.int(0, n - 1) });

/** 확률 p(0~1) 판정. 확률 0이면 무작위를 쓰지 않는다 */
export const chance = (dice: BattleDice, p: number): boolean => p > 0 && dice.draw(10000) < Math.round(p * 10000);

/** 판정값 + 사용한 스탯·보정 내역 */
export type RollBreakdown = RollResult & { faction: string; stats: string[]; parts: Record<string, number> };
export type EscapeOption = 'seal' | 'run';
/** 위험에 들어섰을 때 (D-134): 계속 싸운다 / 영주로 퇴각 / 일반 도주 */
export type DangerChoice = 'fight' | EscapeOption;
/** 국면 지시 (D-127): 마력으로 보구 개방 / 영주 보구 즉시 발동. 영주 버프는 폐지 (D-142) */
export type PhaseCommand = 'np' | 'seal_np';
export type Prompt = (
  /** enemy_np: 상대가 이번 국면에 보구를 개방했다 (D-113) */
  | { kind: 'phase_command'; faction: string; phase_index: number; options: PhaseCommand[]; enemy_np: boolean; mana: number; seals: number }
  /** 운명점 재굴림은 실패했을 때만 묻는다 (D-119). own·opponent_roll에는 보정 내역이 들어 있다 */
  | { kind: 'reroll'; faction: string; context: 'phase' | 'escape' | 'action'; own: RollBreakdown; opponent_total: number | null; opponent_roll: RollBreakdown | null; dc: number | null; fate_points: number }
  | { kind: 'danger_decision'; faction: string; options: DangerChoice[]; seals: number }) & { forecast?: BattleInput };
export type PromptAnswer = boolean | DangerChoice | PhaseCommand | 'none';

export interface BattleOutcome {
  result: 'win' | 'draw' | 'escape' | 'escape_failed';
  winner: string | null;
  loser: string | null;
  dead: string | null;
  escaped: string | null;
  phases: number;
  /** 전투 후 양측 상태 (입력은 바꾸지 않는다) */
  a: Fighter;
  b: Fighter;
}

export type BattleGen = Generator<Prompt, BattleOutcome, PromptAnswer>;

function* askBool(p: Prompt): Generator<Prompt, boolean, PromptAnswer> {
  const a = yield p;
  if (typeof a !== 'boolean') throw new TypeError(`${p.kind}의 답은 true/false여야 한다: ${String(a)}`);
  return a;
}
function* askDanger(p: Extract<Prompt, { kind: 'danger_decision' }>): Generator<Prompt, DangerChoice, PromptAnswer> {
  const a = yield p;
  if (a !== 'fight' && a !== 'seal' && a !== 'run') throw new TypeError(`danger_decision의 답은 fight/seal/run이어야 한다: ${String(a)}`);
  if (!p.options.includes(a)) throw new RangeError(`고를 수 없는 선택: ${a}`);
  return a;
}
function* askPhase(p: Extract<Prompt, { kind: 'phase_command' }>): Generator<Prompt, PhaseCommand | 'none', PromptAnswer> {
  const a = yield p;
  if (a === 'none') return a;
  if (a !== 'np' && a !== 'seal_np') throw new TypeError(`phase_command의 답은 np/seal_np/none이어야 한다: ${String(a)}`);
  if (!p.options.includes(a)) throw new RangeError(`고를 수 없는 국면 지시: ${a}`);
  return a;
}

const other = (s: Side): Side => (s === 'a' ? 'b' : 'a');

export function* battle(input: BattleInput, dice: BattleDice, log: EventLog): BattleGen {
  const F: Record<Side, Fighter> = { a: { ...input.a }, b: { ...input.b } };
  const id = input.battleId;
  const isFinal = input.isFinal ?? false;
  const both = [F.a.faction, F.b.faction];
  const npUsed: Record<Side, number> = { ...(input.checkpoint?.npUsed ?? { a: 0, b: 0 }) };
  const skillUses: Record<Side, Record<string, number>> = { a: { ...input.checkpoint?.skillUses.a }, b: { ...input.checkpoint?.skillUses.b } };
  for (const s of ['a', 'b'] as const) if (!CONDITIONS.includes(F[s].condition)) throw new Error(`전투할 수 없는 상태: ${F[s].faction}`);

  const forecast = (completed: number, current?: BattleCheckpoint['current']): { forecast?: BattleInput } => input.captureForecast ? {
    forecast: { ...input, captureForecast: false, a: { ...F.a }, b: { ...F.b }, checkpoint: {
      completed, npUsed: { ...npUsed }, skillUses: { a: { ...skillUses.a }, b: { ...skillUses.b } },
      ...(current ? { current: { ...current, opened: { ...current.opened } } } : {}),
    } },
  } : {};

  log.emit('battle_started', both, {
    battle_id: id,
    tile: input.tile ?? null,
    terrain: input.terrain,
    is_final: isFinal,
    ambusher: input.ambusher ? F[input.ambusher].faction : null,
    sides: [F.a.faction, F.b.faction],
    ...forecast(input.checkpoint?.completed ?? 0),
  });

  const end = (o: Omit<BattleOutcome, 'a' | 'b'>): BattleOutcome => {
    log.emit('battle_ended', both, { battle_id: id, ...o });
    return { ...o, a: F.a, b: F.b };
  };

  /** 한쪽 판정의 기본 보정 내역 (스탯·스킬 제외) */
  const baseParts = (s: Side, phaseIndex: number): Record<string, number> => {
    const f = F[s];
    const parts: Record<string, number> = {};
    if (f.bonus.affinity) parts.affinity = f.bonus.affinity;
    const intel = K['day.intel_mod'][f.intelLevel]!;
    if (intel) parts.intel = intel;
    if (f.bonus.camp) parts.camp = f.bonus.camp;
    if (phaseIndex === 1 && input.ambusher === s) parts.ambush = K['day.ambush_bonus'];
    return parts;
  };
  const sumParts = (p: Record<string, number>) => Object.values(p).reduce((x, y) => x + y, 0);

  // ── 스킬 (skills.md, D-142): 훅마다 양측 스킬을 보유 순서대로, a → b 순으로 판단한다 ──
  const ctxOf = (s: Side, phaseIndex: number, extra: Partial<SkillCtx> = {}): SkillCtx => ({
    phaseIndex, selfCondition: F[s].condition, camp: F[s].bonus.camp > 0, ...extra,
  });
  const trigger = (s: Side, sk: ActiveSkill, phaseIndex: number, amount: number, target: Side, manaAfter: number | null = null) =>
    log.emit('skill_triggered', [F[s].faction], {
      battle_id: id, phase_index: phaseIndex, faction: F[s].faction, skill_id: sk.skill_id, rank: sk.rank,
      effect: sk.def.effect.type, amount, target: F[target].faction, mana_after: manaAfter,
    });
  /**
   * 판정 보정 (hk_battle_phase_roll / hk_battle_escape): 기본 보정 + 스킬.
   * 굴리는 쪽(rollers)에 닿은 효과만 발동으로 기록한다. 기록은 굴림보다 먼저 남긴다 (화면에서 발동을 먼저 보인다)
   */
  const rollParts = (hook: 'hk_battle_phase_roll' | 'hk_battle_escape', phaseIndex: number, rollers: readonly Side[], extra: (s: Side) => Partial<SkillCtx>) => {
    const parts: Record<Side, Record<string, number>> = { a: baseParts('a', phaseIndex), b: baseParts('b', phaseIndex) };
    for (const s of ['a', 'b'] as const) {
      for (const sk of skillsAt(F[s].skills, hook)) {
        if (!whenOk(sk.def.when, ctxOf(s, phaseIndex, extra(s)))) continue;
        const eff = sk.def.effect;
        const target = eff.target === 'self' ? s : other(s);
        if (!rollers.includes(target)) continue;
        if (eff.type === 'roll_mod') {
          const amount = skillAmount(sk) * (eff.sign ?? 1);
          if (!amount) continue;
          parts[target][target === s ? sk.skill_id : `foe:${sk.skill_id}`] = amount;
          trigger(s, sk, phaseIndex, amount, target);
        } else if (eff.type === 'event_negate') {
          // 무효: 음수 호감도 보정(자기) / 정보 보정(상대). 없애는 값이 있을 때만 발동
          const key = eff.kind === 'affinity_penalty' ? 'affinity' : 'intel';
          const v = parts[target][key];
          if (v === undefined || (eff.kind === 'affinity_penalty' && v >= 0)) continue;
          delete parts[target][key];
          trigger(s, sk, phaseIndex, 0, target);
        }
      }
    }
    return parts;
  };

  /** 대항 판정 한 번 (양측 굴림 + 플레이어 재굴림) */
  function* contestFor(stats: Record<Side, readonly StatId[]>, context: 'phase' | 'escape', parts: Record<Side, Record<string, number>>) {
    const mod = (s: Side) => statSum(F[s].servant, stats[s]) + sumParts(parts[s]);
    const judge = (ra: NaturalRoll, rb: NaturalRoll) =>
      contest({ roll: ra, modifier: mod('a'), miracle: miracleNaturals(F.a.servant) }, { roll: rb, modifier: mod('b'), miracle: miracleNaturals(F.b.servant) });
    // 양측이 먼저 굴린 뒤, 플레이어가 상대 판정값을 보고 재굴림을 고른다
    const rolls = { a: dice.roll(), b: dice.roll() };
    const rerolls = { a: 0, b: 0 };
    for (const s of ['a', 'b'] as const) {
      if (F[s].controller !== 'player') continue;
      while (F[s].fatePoints > 0) {
        const r = judge(rolls.a, rolls.b);
        const o = other(s);
        if (!(r[s].total < r[o].total)) break; // 지고 있을 때만 (D-119). 동점은 스킵 또는 도주 성공이라 실패가 아니다
        const again = yield* askBool({
          kind: 'reroll',
          faction: F[s].faction,
          context,
          own: { ...r[s], faction: F[s].faction, stats: [...stats[s]], parts: parts[s] },
          opponent_total: r[o].total,
          opponent_roll: { ...r[o], faction: F[o].faction, stats: [...stats[o]], parts: parts[o] },
          dc: null,
          fate_points: F[s].fatePoints,
        });
        if (!again) break;
        F[s].fatePoints -= 1;
        rerolls[s] += 1;
        rolls[s] = dice.roll();
      }
    }
    const r = judge(rolls.a, rolls.b);
    const record = (s: Side): RollRecord => ({ ...r[s], faction: F[s].faction, stats: [...stats[s]], parts: parts[s], rerolls: rerolls[s] });
    return { result: r, records: [record('a'), record('b')] };
  }

  const limit = isFinal ? Infinity : K['combat.phase_count'];
  let index = input.checkpoint?.completed ?? 0;
  let resumed = input.checkpoint?.current;
  while (index < limit) {
    index += 1;

    // 1. 국면 지시: 보구 개방(마력)·영주 보구 즉시 발동 (combat.md §4, §5.1, phases.md §3.6, D-101, D-127, D-142).
    //    적 AI가 먼저 정하고, 플레이어는 그걸 보고 한 번에 고른다 (D-113)
    const current = resumed;
    resumed = undefined;
    // 국면 시작 스킬 (hk_battle_phase_select): 보구 판단 전에 마력 회복 등. 이어서 예측할 때는 이미 반영돼 있다
    if (!current) {
      for (const s of ['a', 'b'] as const) {
        for (const sk of skillsAt(F[s].skills, 'hk_battle_phase_select')) {
          if (!whenOk(sk.def.when, ctxOf(s, index)) || sk.def.effect.type !== 'resource_change') continue;
          const before = F[s].mana;
          F[s].mana = Math.min(K['mana.max'], before + skillAmount(sk));
          if (F[s].mana !== before) trigger(s, sk, index, F[s].mana - before, s, F[s].mana);
        }
      }
    }
    const opened: Record<Side, boolean> = { ...(current?.opened ?? { a: false, b: false }) };
    const order = (['a', 'b'] as const).filter((s) => F[s].controller === 'ai').concat((['a', 'b'] as const).filter((s) => F[s].controller === 'player'));
    /** 보구는 전투당 1회, 마력 80 (D-135) */
    const canNp = (s: Side) => !opened[s] && npUsed[s] < K['combat.np_per_battle'] && F[s].mana >= K['mana.np_threshold'];
    const openNp = (s: Side, seal: boolean) => {
      const f = F[s];
      const before = f.mana;
      if (!seal) f.mana -= K['mana.np_cost'];
      opened[s] = true;
      npUsed[s] += 1;
      log.emit('np_opened', [f.faction], { battle_id: id, phase_index: index, faction: f.faction, seal, mana_before: before, mana_after: f.mana });
      const observer = F[other(s)];
      const revealed = K['day.intel_mod'].length - 1;
      if (observer.controller === 'player' && observer.intelLevel < revealed) {
        const from = observer.intelLevel;
        observer.intelLevel = revealed;
        log.emit('intel_gained', [observer.faction, f.faction], {
          target: f.faction, level_from: from, level_to: revealed, result: 'success', cause: 'np', roll: null, dc: null,
        });
      }
    };
    const useSeal = (s: Side, purpose: 'np') => {
      const f = F[s];
      f.seals -= 1;
      log.emit('seal_used', [f.faction], { battle_id: id, faction: f.faction, purpose, seals_left: f.seals });
    };
    for (const s of current?.phase ? [] : order) {
      const f = F[s];
      if (f.controller === 'ai') {
        if (current?.aiDecided) continue;
        // 적 AI는 함부로 열지 않는다: 낮은 확률, 위험하면 조금 더 (D-136)
        const p = f.condition === 'danger' ? K['ai.np_open_chance'].danger : K['ai.np_open_chance'].base;
        if (canNp(s) && chance(dice, p)) openNp(s, false);
        continue;
      }
      const options: PhaseCommand[] = [];
      if (canNp(s)) options.push('np');
      if (!opened[s] && npUsed[s] < K['combat.np_per_battle'] && f.seals > 0) options.push('seal_np');
      if (!options.length) continue;
      const cmd = yield* askPhase({ kind: 'phase_command', faction: f.faction, phase_index: index, options, enemy_np: opened[other(s)], mana: f.mana, seals: f.seals, ...forecast(index - 1, { opened, aiDecided: true }) });
      if (cmd === 'np') openNp(s, false);
      else if (cmd === 'seal_np') {
        // 영주 보구 즉시 발동: 마력 조건 없이, 마력 소모 없음 (D-076). 전투당 1회에 포함 (D-135)
        useSeal(s, 'np');
        openNp(s, true);
      }
    }
    // 상대가 보구를 열면 적 AI는 따라서 연다 (D-136)
    for (const s of ['a', 'b'] as const) if (F[s].controller === 'ai' && !opened[s] && opened[other(s)] && canNp(s)) openNp(s, false);

    // 2. 국면 유형과 공격측 (phases.md §3.2 ~ §3.4)
    const coin = (): Side => (dice.draw(2) === 0 ? 'a' : 'b');
    const np = phaseFromNp(opened.a, opened.b);
    let phaseId: PhaseId;
    let attacker: Side;
    if (current?.phase) {
      phaseId = current.phase.id;
      attacker = current.phase.attacker;
    } else if (np) {
      phaseId = np.phase;
      attacker = np.attacker ?? coin();
    } else {
      phaseId = phaseFromDraw(input.terrain, dice.draw(terrainWeightTotal(input.terrain)));
      attacker = index === 1 && input.ambusher ? input.ambusher : coin();
    }
    const defender = other(attacker);
    const def = phaseDef(phaseId);
    log.emit('phase_started', both, { battle_id: id, phase_index: index, phase_id: phaseId, attacker: F[attacker].faction, defender: F[defender].faction, ...forecast(index - 1, { opened, aiDecided: true, phase: { id: phaseId, attacker } }) });

    // 3. 판정
    let winner: Side | null = null;
    let margin = 0;
    let drop: 0 | 1 | 2 = 0;
    let miracle = false;
    let defended = false;
    if (def.kind === 'contest') {
      const stats = { [attacker]: def.attacker_stat, [defender]: def.defender_stat } as Record<Side, StatId[]>;
      const role = (s: Side) => ({ phase: phaseId, role: s === attacker ? ('attacker' as const) : ('defender' as const) });
      const parts = rollParts('hk_battle_phase_roll', index, ['a', 'b'], role);
      const { result, records } = yield* contestFor(stats, 'phase', parts);
      log.emit('phase_rolled', both, { battle_id: id, phase_index: index, phase_id: phaseId, kind: 'contest', rolls: records, dc: null });
      if (phaseId === 'ph_np_attack' && result.winner === defender) {
        // 한쪽만 보구를 열고 판정에서 졌다: 상대가 버티거나 피했을 뿐, 보구를 연 쪽은 피해를 입지 않는다 (D-120)
        defended = true;
      } else if (result.winner !== 'tie') {
        winner = result.winner;
        margin = result.margin;
        miracle = result[winner].miracle;
        const w = result[winner].total;
        const l = result[other(winner)].total;
        drop = w >= l * K['combat.big_loss_ratio'] ? 2 : 1; // D-092
      }
    } else {
      // 즉사/우연: 방어측 단독 판정 (phases.md §3.5, D-097)
      const dc = K['phase.fate_dc'];
      const parts = rollParts('hk_battle_phase_roll', index, [defender], (s) => ({ phase: phaseId, role: s === attacker ? 'attacker' : 'defender' }))[defender];
      const mod = statSum(F[defender].servant, def.defender_stat) + sumParts(parts);
      const mir = miracleNaturals(F[defender].servant);
      const f = F[defender];
      let roll = dice.roll();
      let rerolls = 0;
      while (f.controller === 'player' && f.fatePoints > 0) {
        const c0 = check(roll, mod, mir, dc);
        if (c0.success) break; // 실패했을 때만 (D-119)
        const again = yield* askBool({ kind: 'reroll', faction: f.faction, context: 'phase', own: { ...c0.roll, faction: f.faction, stats: [...def.defender_stat], parts }, opponent_total: null, opponent_roll: null, dc, fate_points: f.fatePoints });
        if (!again) break;
        f.fatePoints -= 1;
        rerolls += 1;
        roll = dice.roll();
      }
      const c = check(roll, mod, mir, dc);
      log.emit('phase_rolled', both, {
        battle_id: id,
        phase_index: index,
        phase_id: phaseId,
        kind: 'solo',
        rolls: [{ ...c.roll, faction: f.faction, stats: [...def.defender_stat], parts, rerolls }],
        dc,
      });
      if (!c.success) {
        winner = attacker;
        drop = 1;
      }
    }

    const loser = winner ? other(winner) : null;
    const from = loser ? F[loser].condition : null;
    const toIndex = from ? CONDITIONS.indexOf(from) + drop : -1;
    // 전투속행 (hk_battle_condition_change, condition_guard): 위험에서 쓰러질 때 전투당 정해진 횟수만큼 위험에서 버틴다.
    // 결과 기록(phase_resolved)부터 '버팀'으로 남긴다: 쓰러진 것으로 서술되지 않게
    const guard = loser && from === 'danger'
      ? skillsAt(F[loser].skills, 'hk_battle_condition_change').find((sk) =>
          sk.def.effect.type === 'condition_guard' && whenOk(sk.def.when, ctxOf(loser, index, { wouldFall: true })) &&
          (skillUses[loser][sk.skill_id] ?? 0) < (sk.def.uses_per_battle ?? Infinity))
      : undefined;
    const to = from === 'danger' ? (guard ? 'danger' : 'below') : from ? CONDITIONS[Math.min(toIndex, CONDITIONS.length - 1)]! : null;
    log.emit('phase_resolved', both, {
      battle_id: id,
      phase_index: index,
      phase_id: phaseId,
      skipped: winner === null,
      defended,
      winner: winner ? F[winner].faction : null,
      loser: loser ? F[loser].faction : null,
      margin,
      drop,
      miracle,
      condition_from: from,
      condition_to: to,
    });
    if (!winner || !loser || !from) continue; // 동점·즉사 판정 성공은 국면 스킵 (D-017)

    // 4. 상태 하락 (combat.md §3.4, D-134)
    //    위험에서 또 맞으면 쓰러진다. 위험을 건너뛰는 2단계 하락은 위험에서 멈춘다
    const lf = F[loser];
    const die = () => {
      log.emit('condition_changed', [lf.faction], { battle_id: id, faction: lf.faction, from, to: 'dead' });
      return end({ result: 'win', winner: F[winner].faction, loser: lf.faction, dead: lf.faction, escaped: null, phases: index });
    };
    if (from === 'danger') {
      if (!guard) return die();
      skillUses[loser][guard.skill_id] = (skillUses[loser][guard.skill_id] ?? 0) + 1;
      trigger(loser, guard, index, 0, loser);
      continue; // 위험 그대로. 이미 위험이라 위험 진입 선택은 묻지 않는다
    }
    lf.condition = to === 'below' ? 'danger' : to!;
    log.emit('condition_changed', [lf.faction], { battle_id: id, faction: lf.faction, from, to: lf.condition });
    // 상대가 무너질 때 (hk_battle_condition_change, foe_dropped): 마력 흡수 등
    for (const sk of skillsAt(F[winner].skills, 'hk_battle_condition_change')) {
      if (sk.def.effect.type !== 'resource_change' || !whenOk(sk.def.when, ctxOf(winner, index, { foeDropped: true }))) continue;
      const w = F[winner];
      const before = w.mana;
      w.mana = Math.min(K['mana.max'], before + skillAmount(sk));
      if (w.mana !== before) trigger(winner, sk, index, w.mana - before, winner, w.mana);
    }
    if (lf.condition !== 'danger' || isFinal) continue; // 강제 전투는 물러설 수 없다 (§7-4)

    // 5. 위험에 들어섰다: 계속 싸울지, 물러날지 (§3.4-3, D-134)
    const sealEscape = () => {
      lf.seals -= 1;
      log.emit('seal_used', [lf.faction], { battle_id: id, faction: lf.faction, purpose: 'escape', seals_left: lf.seals });
      return end({ result: 'escape', winner: null, loser: null, dead: null, escaped: lf.faction, phases: index });
    };
    let choice: DangerChoice;
    if (lf.controller === 'ai') {
      // 마스터 성향이 정한다. 교활은 상대보다 상태가 나쁘면 거의 물러난다
      const t = lf.temperament ?? 'proud';
      const behind = CONDITIONS.indexOf(lf.condition) > CONDITIONS.indexOf(F[winner].condition);
      const R = K['ai.retreat_chance'];
      const p = t === 'cunning' ? (behind ? R.cunning_behind : R.cunning) : (R[t as keyof typeof R] ?? R.proud);
      choice = chance(dice, p) ? (lf.seals > 0 ? 'seal' : 'run') : 'fight';
    } else {
      const options: DangerChoice[] = lf.seals > 0 ? ['fight', 'seal', 'run'] : ['fight', 'run'];
      choice = yield* askDanger({ kind: 'danger_decision', faction: lf.faction, options, seals: lf.seals, ...forecast(index) });
    }
    log.emit('danger_decided', [lf.faction], { battle_id: id, faction: lf.faction, choice });
    if (choice === 'fight') continue;
    if (choice === 'seal') return sealEscape(); // 영주 명령은 거부할 수 없다 (D-109)

    // 명령 거부 (D-083): 일반 도주를 거부하면 물러나지 않고 계속 싸운다
    if (chance(dice, lf.refusal)) {
      log.emit('refused', [lf.faction], { faction: lf.faction, command: 'escape' });
      continue;
    }

    // 일반 도주: 민첩 대항. 동점은 성공 (D-100). 실패하면 전쟁 패배 (§3.4-3)
    const escParts = rollParts('hk_battle_escape', index, ['a', 'b'], (s) => ({ escaper: s === loser }));
    const { result, records } = yield* contestFor({ a: ['agi'], b: ['agi'] }, 'escape', escParts);
    const success = result.winner !== winner;
    log.emit('escape_attempted', [lf.faction], { battle_id: id, faction: lf.faction, context: 'battle', success, rolls: records });
    if (success) return end({ result: 'escape', winner: null, loser: null, dead: null, escaped: lf.faction, phases: index });
    return end({ result: 'escape_failed', winner: F[winner].faction, loser: lf.faction, dead: null, escaped: null, phases: index });
  }

  return end({ result: 'draw', winner: null, loser: null, dead: null, escaped: null, phases: index });
}

export type Policy = (p: Prompt) => PromptAnswer;

/** 전투를 끝까지 돌린다. 개입 지점은 정책 함수가 답한다 */
export function runBattle(input: BattleInput, dice: BattleDice, log: EventLog, policy: Policy): BattleOutcome {
  const gen = battle(input, dice, log);
  let step = gen.next();
  while (!step.done) step = gen.next(policy(step.value));
  return step.value;
}
