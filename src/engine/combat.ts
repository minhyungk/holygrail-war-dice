// 3국면 자동 전투 (docs/systems/combat.md, phases.md, dice.md).
// 전투는 제너레이터로 진행한다: 개입 지점(combat.md §4)에서 Prompt를 내보내고 답을 받아 이어 간다.
// UI는 Prompt를 화면에 띄우고, 헤드리스 시뮬은 정책 함수로 답한다 (runBattle).
import { K } from '../data/constants';
import type { PhaseId, ServantProfile, StatId, Terrain } from '../data/schema';
import { check, contest, type NaturalRoll, rollNatural, type RollResult } from './dice';
import type { Condition, EventLog, RollRecord, Side } from './events';
import { phaseDef, phaseFromDraw, phaseFromNp, terrainWeightTotal } from './phases';
import type { Rng } from './rng';
import { manaByRank, miracleNaturals, statSum } from './stats';

export const CONDITIONS: readonly Condition[] = ['full', 'hurt', 'danger']; // D-014

/** 판정에 늘 더해지는 보정 (dice.md §3.3). 스탯·기적·영주 버프·기습은 전투가 계산한다 */
export interface FixedBonus {
  /** 호감도 보정 (affinity.md §3.4) */
  affinity: number;
  /** 상대에 대한 정보 보정 (day-loop.md §4.3) */
  intel: number;
  /** 진지 보정 (day-loop.md §13) */
  camp: number;
}
export const NO_BONUS: FixedBonus = { affinity: 0, intel: 0, camp: 0 };

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
  /** 명령 거부 확률 (affinity.md §3.4). 적 AI는 0 */
  refusal: number;
  /** 마스터 성향 (적 AI의 퇴각 판단, D-134). 플레이어는 null */
  temperament: string | null;
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
    refusal: 0,
    temperament: null,
    ...overrides,
  };
}

export interface BattleInput {
  battleId: string;
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
export type RollBreakdown = RollResult & { stats: string[]; parts: Record<string, number> };
export type EscapeOption = 'seal' | 'run';
/** 위험에 들어섰을 때 (D-134): 계속 싸운다 / 영주로 퇴각 / 일반 도주 */
export type DangerChoice = 'fight' | EscapeOption;
/** 국면 지시 (D-127): 마력으로 보구 개방 / 영주 보구 즉시 발동 / 영주 버프 */
export type PhaseCommand = 'np' | 'seal_np' | 'seal_buff';
export type Prompt =
  /** enemy_np: 상대가 이번 국면에 보구를 개방했다 (D-113) */
  | { kind: 'phase_command'; faction: string; phase_index: number; options: PhaseCommand[]; enemy_np: boolean; mana: number; seals: number }
  /** 운명점 재굴림은 실패했을 때만 묻는다 (D-119). own·opponent_roll에는 보정 내역이 들어 있다 */
  | { kind: 'reroll'; faction: string; context: 'phase' | 'escape' | 'action'; own: RollBreakdown; opponent_total: number | null; opponent_roll: RollBreakdown | null; dc: number | null; fate_points: number }
  | { kind: 'danger_decision'; faction: string; options: DangerChoice[]; seals: number };
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
  if (a !== 'np' && a !== 'seal_np' && a !== 'seal_buff') throw new TypeError(`phase_command의 답은 np/seal_np/seal_buff/none이어야 한다: ${String(a)}`);
  if (!p.options.includes(a)) throw new RangeError(`고를 수 없는 국면 지시: ${a}`);
  return a;
}

const other = (s: Side): Side => (s === 'a' ? 'b' : 'a');

export function* battle(input: BattleInput, dice: BattleDice, log: EventLog): BattleGen {
  const F: Record<Side, Fighter> = { a: { ...input.a }, b: { ...input.b } };
  const id = input.battleId;
  const isFinal = input.isFinal ?? false;
  const both = [F.a.faction, F.b.faction];
  const buffed: Record<Side, boolean> = { a: false, b: false };
  const npUsed: Record<Side, number> = { a: 0, b: 0 };
  for (const s of ['a', 'b'] as const) if (!CONDITIONS.includes(F[s].condition)) throw new Error(`전투할 수 없는 상태: ${F[s].faction}`);

  log.emit('battle_started', both, {
    battle_id: id,
    tile: input.tile ?? null,
    terrain: input.terrain,
    is_final: isFinal,
    ambusher: input.ambusher ? F[input.ambusher].faction : null,
    sides: [F.a.faction, F.b.faction],
  });

  const end = (o: Omit<BattleOutcome, 'a' | 'b'>): BattleOutcome => {
    log.emit('battle_ended', both, { battle_id: id, ...o });
    return { ...o, a: F.a, b: F.b };
  };

  /** 한쪽 판정의 보정 내역 (스탯 제외) */
  const partsFor = (s: Side, phaseIndex: number): Record<string, number> => {
    const f = F[s];
    const parts: Record<string, number> = {};
    if (f.bonus.affinity) parts.affinity = f.bonus.affinity;
    if (f.bonus.intel) parts.intel = f.bonus.intel;
    if (f.bonus.camp) parts.camp = f.bonus.camp;
    if (buffed[s]) parts.seal = K['combat.seal_buff'];
    if (phaseIndex === 1 && input.ambusher === s) parts.ambush = K['day.ambush_bonus'];
    return parts;
  };
  const sumParts = (p: Record<string, number>) => Object.values(p).reduce((x, y) => x + y, 0);

  /** 대항 판정 한 번 (양측 굴림 + 플레이어 재굴림) */
  function* contestFor(stats: Record<Side, readonly StatId[]>, context: 'phase' | 'escape', phaseIndex: number) {
    const parts = { a: partsFor('a', phaseIndex), b: partsFor('b', phaseIndex) };
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
          own: { ...r[s], stats: [...stats[s]], parts: parts[s] },
          opponent_total: r[o].total,
          opponent_roll: { ...r[o], stats: [...stats[o]], parts: parts[o] },
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
  let index = 0;
  while (index < limit) {
    index += 1;

    // 1. 국면 지시: 보구 개방(마력)·영주 보구 즉시 발동·영주 버프 (combat.md §4, §5.1, phases.md §3.6, D-101, D-127).
    //    적 AI가 먼저 정하고, 플레이어는 그걸 보고 한 번에 고른다 (D-113). 버프를 고르면 이어서 보구도 고를 수 있다
    const opened: Record<Side, boolean> = { a: false, b: false };
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
    };
    const useSeal = (s: Side, purpose: 'np' | 'buff') => {
      const f = F[s];
      f.seals -= 1;
      log.emit('seal_used', [f.faction], { battle_id: id, faction: f.faction, purpose, seals_left: f.seals });
    };
    for (const s of order) {
      const f = F[s];
      if (f.controller === 'ai') {
        // 적 AI는 함부로 열지 않는다: 낮은 확률, 위험하면 조금 더 (D-136)
        const p = f.condition === 'danger' ? K['ai.np_open_chance'].danger : K['ai.np_open_chance'].base;
        if (canNp(s) && chance(dice, p)) openNp(s, false);
        continue;
      }
      for (;;) {
        const options: PhaseCommand[] = [];
        if (canNp(s)) options.push('np');
        if (!opened[s] && npUsed[s] < K['combat.np_per_battle'] && f.seals > 0) options.push('seal_np');
        if (!buffed[s] && f.seals > 0) options.push('seal_buff');
        if (!options.length) break;
        const cmd = yield* askPhase({ kind: 'phase_command', faction: f.faction, phase_index: index, options, enemy_np: opened[other(s)], mana: f.mana, seals: f.seals });
        if (cmd === 'none') break;
        if (cmd === 'np') openNp(s, false);
        else if (cmd === 'seal_np') {
          // 영주 보구 즉시 발동: 마력 조건 없이, 마력 소모 없음 (D-076). 전투당 1회에 포함 (D-135)
          useSeal(s, 'np');
          openNp(s, true);
        } else {
          useSeal(s, 'buff');
          buffed[s] = true;
          continue; // 버프 뒤에 보구를 더 고를 수 있다
        }
        break;
      }
    }
    // 상대가 보구를 열면 적 AI는 따라서 연다 (D-136)
    for (const s of ['a', 'b'] as const) if (F[s].controller === 'ai' && !opened[s] && opened[other(s)] && canNp(s)) openNp(s, false);

    // 2. 국면 유형과 공격측 (phases.md §3.2 ~ §3.4)
    const coin = (): Side => (dice.draw(2) === 0 ? 'a' : 'b');
    const np = phaseFromNp(opened.a, opened.b);
    let phaseId: PhaseId;
    let attacker: Side;
    if (np) {
      phaseId = np.phase;
      attacker = np.attacker ?? coin();
    } else {
      phaseId = phaseFromDraw(input.terrain, dice.draw(terrainWeightTotal(input.terrain)));
      attacker = index === 1 && input.ambusher ? input.ambusher : coin();
    }
    const defender = other(attacker);
    const def = phaseDef(phaseId);
    log.emit('phase_started', both, { battle_id: id, phase_index: index, phase_id: phaseId, attacker: F[attacker].faction, defender: F[defender].faction });

    // 3. 판정
    let winner: Side | null = null;
    let margin = 0;
    let drop: 0 | 1 | 2 = 0;
    let miracle = false;
    let defended = false;
    if (def.kind === 'contest') {
      const stats = { [attacker]: def.attacker_stat, [defender]: def.defender_stat } as Record<Side, StatId[]>;
      const { result, records } = yield* contestFor(stats, 'phase', index);
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
      const parts = partsFor(defender, index);
      const mod = statSum(F[defender].servant, def.defender_stat) + sumParts(parts);
      const mir = miracleNaturals(F[defender].servant);
      const f = F[defender];
      let roll = dice.roll();
      let rerolls = 0;
      while (f.controller === 'player' && f.fatePoints > 0) {
        const c0 = check(roll, mod, mir, dc);
        if (c0.success) break; // 실패했을 때만 (D-119)
        const again = yield* askBool({ kind: 'reroll', faction: f.faction, context: 'phase', own: { ...c0.roll, stats: [...def.defender_stat], parts }, opponent_total: null, opponent_roll: null, dc, fate_points: f.fatePoints });
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
    const to = from ? (toIndex < CONDITIONS.length ? CONDITIONS[toIndex]! : 'below') : null;
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
    if (from === 'danger') return die();
    lf.condition = to === 'below' ? 'danger' : to!;
    log.emit('condition_changed', [lf.faction], { battle_id: id, faction: lf.faction, from, to: lf.condition });
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
      choice = yield* askDanger({ kind: 'danger_decision', faction: lf.faction, options, seals: lf.seals });
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
    const { result, records } = yield* contestFor({ a: ['agi'], b: ['agi'] }, 'escape', index);
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
