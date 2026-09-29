// 한 판 진행 (docs/00-overview.md §3, systems/day-loop.md, combat.md §7·§8, affinity.md).
// 메인 → 소환 → 7일 낮·밤 루프 → 강제 전투(토너먼트) → 우승 / 패배 (D-102).
// 판 전체가 하나의 제너레이터다. 플레이어가 고를 때마다 RunPrompt를 내보내고 답을 받아 이어 간다.
// 플레이어가 탈락하면 같은 제너레이터가 적 AI 규칙만으로 끝까지 진행한다 (패배 빨리감기, D-043).
import { K } from '../data/constants';
import type { MasterProfile, Reaction, ServantProfile, ServantSkillsFile, StatId } from '../data/schema';
import { addClamped, applyDelta, betrayalChance, initialAffinity, postChoiceDelta, reactionDelta, refusalChance, rollMod, tierOf } from './affinity';
import { battle, type BattleInput, type BattleOutcome, type BattleDice, chance, createFighter, type Fighter, NO_BONUS, type Prompt, type PromptAnswer, rngDice, runBattle } from './combat';
import { check, contest, type NaturalRoll } from './dice';
import { type Condition, EventLog, type FactionSetup, type RollRecord, type SupplyResult } from './events';
import { allTileIds, centerTileId, distance, moveRange, neighbors, reachable, tile } from './map';
import { createRng, deriveSeed, type Rng } from './rng';
import { manaByRank, miracleNaturals, parseRank, statSum } from './stats';

export const PLAYER_FACTION = 'fc_player';
/** 칸 역할: 밤을 마친 칸의 역할이 다음 날 보너스가 된다 (D-145) */
export type TileRole = 'leyline' | 'intel' | 'bond';
/** 낮 메뉴 (D-145) */
export type DayAction = 'intel' | 'bond';

export type RunPrompt =
  | Prompt
  /** 밤 이동. reachable에는 자기 칸이 들어 있다 (머무르기, D-112) */
  | { kind: 'action'; time: 'night'; day: number; action_index: number; reachable: string[] }
  /** 낮 메뉴 1회 (D-145). bonus = 오늘 칸 보너스, intel_open = 진명을 모르는 적이 남았나 */
  | { kind: 'day_action'; day: number; tile: string; role: TileRole; options: DayAction[]; bonus: Record<DayAction, number>; intel_open: boolean }
  /** 아침: 서번트가 마력 공급을 청한다 */
  | { kind: 'supply_offer'; reason: 'hurt' | 'trust'; condition: Condition; affinity: number }
  | { kind: 'encounter'; enemy: string; tile: string; ambusher: string | null; forecast?: BattleInput }
  | { kind: 'post_choice'; target: string }
  | { kind: 'betrayal_block'; seals: number };
export type ActionAnswer = { action: 'move'; to: string };
export type DayAnswer = { action: DayAction };
export type RunAnswer = PromptAnswer | ActionAnswer | DayAnswer | 'fight' | 'flee' | 'execute' | 'release';

// ── 준비 ──

export interface EnemyPlan {
  faction: string;
  servant_id: string;
  master_id: string;
}
export interface RunPlan {
  seed: number;
  summon: 'random' | 'catalyst';
  player_servant_id: string;
  enemies: EnemyPlan[];
}

/**
 * 소환과 적 진영 구성 (S1_SUMMON). 랜덤 소환은 순수 랜덤, 촉매 소환은 고른 서번트.
 * 적은 남은 서번트 전부와, 마스터 풀에서 뽑은 같은 수의 마스터를 무작위로 짝짓는다 (D-045, D-109).
 */
export function planRun(opts: { seed: number; summon: 'random' | 'catalyst'; catalyst?: string; servantIds: readonly string[]; masterIds: readonly string[] }): RunPlan {
  const rng = createRng(deriveSeed(opts.seed, 'plan'));
  const servants = [...opts.servantIds].sort();
  let player: string;
  if (opts.summon === 'catalyst') {
    if (!opts.catalyst || !servants.includes(opts.catalyst)) throw new Error(`촉매 소환 대상이 없다: ${opts.catalyst}`);
    player = opts.catalyst;
  } else player = servants[rng.int(0, servants.length - 1)]!;
  const rest = shuffle(servants.filter((s) => s !== player), rng);
  const masters = shuffle([...opts.masterIds].sort(), rng);
  if (masters.length < rest.length) throw new Error(`마스터가 모자란다: ${masters.length} < ${rest.length}`);
  return {
    seed: opts.seed,
    summon: opts.summon,
    player_servant_id: player,
    enemies: rest.map((sv, i) => ({ faction: `fc_e${i + 1}`, servant_id: sv, master_id: masters[i]! })),
  };
}

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export interface RunData {
  servants: Record<string, ServantProfile>;
  skills: Record<string, ServantSkillsFile>;
  masters: Record<string, MasterProfile>;
}

// ── 상태 ──

export interface FactionState {
  id: string;
  servant: ServantProfile;
  skills: ServantSkillsFile | null;
  master: MasterProfile | null;
  controller: 'player' | 'ai';
  tile: string;
  condition: Condition;
  mana: number;
  seals: number;
  fatePoints: number;
  /** 플레이어 서번트만 */
  affinity: number | null;
  alive: boolean;
  /** 남은 영주 퇴각 횟수 (적 AI만 제한, D-149) */
  sealRetreats: number;
}

export interface RunState {
  plan: RunPlan;
  factions: Record<string, FactionState>;
  /** 플레이어가 아는 적 진영 정보 단계 (day-loop.md §4.3) */
  intel: Record<string, number>;
  suppliedDay: number;
  battleSeq: number;
}

export interface RunResult {
  result: 'victory' | 'defeat';
  winner: string | null;
  state: RunState;
}

// ── 진행 ──

export function* playRun(plan: RunPlan, data: RunData, opts: { fatePoints: number }, log: EventLog): Generator<RunPrompt, RunResult, RunAnswer> {
  const rng = createRng(deriveSeed(plan.seed, 'judge'));
  const dice = rngDice(rng);
  const fp = Math.round(opts.fatePoints);
  if (fp < K['dice.fate_point_min'] || fp > K['dice.fate_point_max']) throw new RangeError(`운명점 범위 밖: ${fp}`);

  // 시작 위치: 서로 다른 타일, 중앙 제외, 시드 RNG (content/map-fuyuki.md §5, D-109)
  const starts = shuffle(allTileIds().filter((t) => t !== centerTileId()), rng);
  const sv = (id: string) => {
    const s = data.servants[id];
    if (!s) throw new Error(`서번트 데이터 없음: ${id}`);
    return s;
  };
  const player: FactionState = {
    id: PLAYER_FACTION,
    servant: sv(plan.player_servant_id),
    skills: data.skills[plan.player_servant_id] ?? null,
    master: null,
    controller: 'player',
    tile: starts[0]!,
    condition: 'full',
    mana: 0,
    seals: K['combat.command_seals'],
    fatePoints: fp,
    affinity: initialAffinity(sv(plan.player_servant_id)),
    alive: true,
    sealRetreats: Infinity,
  };
  const S: RunState = { plan, factions: { [PLAYER_FACTION]: player }, intel: {}, suppliedDay: 0, battleSeq: 0 };
  plan.enemies.forEach((e, i) => {
    const m = data.masters[e.master_id];
    if (!m) throw new Error(`마스터 데이터 없음: ${e.master_id}`);
    S.factions[e.faction] = {
      id: e.faction,
      servant: sv(e.servant_id),
      skills: data.skills[e.servant_id] ?? null,
      master: m,
      controller: 'ai',
      tile: starts[i + 1]!,
      condition: 'full',
      mana: 0,
      seals: K['combat.command_seals'],
      fatePoints: 0,
      affinity: null,
      alive: true,
      sealRetreats: K['ai.seal_retreat_max'],
    };
    S.intel[e.faction] = 0;
  });
  for (const f of Object.values(S.factions)) f.mana = manaInit(f.servant);

  const factions = () => Object.values(S.factions);
  const alive = () => factions().filter((f) => f.alive);
  const playerActive = () => player.alive;
  let playerOutAt: number | null = null;

  log.clock = { day: 1, time: 'day', action: 0 };
  log.emit(
    'run_started',
    factions().map((f) => f.id),
    {
      seed: plan.seed,
      player: PLAYER_FACTION,
      summon: plan.summon,
      factions: factions().map(
        (f): FactionSetup => ({
          faction: f.id,
          servant_id: f.servant.servant_id,
          master_id: f.master?.master_id ?? null,
          controller: f.controller,
          tile: f.tile,
          condition: f.condition,
          mana: f.mana,
          seals: f.seals,
          fate_points: f.fatePoints,
          affinity: f.affinity,
        }),
      ),
    },
  );

  const eliminate = (f: FactionState, cause: Parameters<typeof log.emit<'eliminated'>>[2]['cause'], by: string | null) => {
    f.alive = false;
    log.emit('eliminated', [f.id], { faction: f.id, cause, by });
    if (f === player) playerOutAt = log.events.length;
  };

  const changeAffinity = (base: number, cause: string) => {
    if (player.affinity === null || !player.alive) return;
    const from = player.affinity;
    const to = applyDelta(from, base, player.servant);
    if (to === from) return;
    player.affinity = to;
    log.emit('affinity_changed', [player.id], { faction: player.id, from, to, tier_from: tierOf(from), tier_to: tierOf(to), cause });
  };
  /** 플레이어 선택에 대한 서번트의 반응 (affinity.md §3.6, D-150): 표 값을 그대로 더한다 */
  const react = (faction: string, reaction: Reaction) => {
    if (faction !== player.id || player.affinity === null || !player.alive) return;
    const from = player.affinity;
    const to = addClamped(from, reactionDelta(player.servant, reaction));
    if (to === from) return;
    player.affinity = to;
    log.emit('affinity_changed', [player.id], { faction: player.id, from, to, tier_from: tierOf(from), tier_to: tierOf(to), cause: `react:${reaction}` });
  };
  /** 정보 단계를 올린다 (D-147). 이미 그 이상이면 아무 일도 없다 */
  const raiseIntel = (target: FactionState, to: number, cause: 'encounter' | 'battle') => {
    const from = S.intel[target.id] ?? 0;
    const next = Math.min(K['day.intel_mod'].length - 1, to);
    if (next <= from) return;
    S.intel[target.id] = next;
    log.emit('intel_gained', [player.id, target.id], { target: target.id, level_from: from, level_to: next, result: 'success', cause, roll: null, dc: null });
  };

  /** 플레이어의 단독 판정. auto면 재굴림을 묻지 않는다 (낮 행동, D-145). 아니면 실패했을 때 운명점 재굴림을 묻는다 */
  function* playerCheck(stats: readonly StatId[], extra: Record<string, number>, dc: number | null, auto = false) {
    const parts: Record<string, number> = { ...extra };
    const aff = rollMod(player.affinity ?? 0);
    if (aff) parts.affinity = aff;
    const mod = statSum(player.servant, stats) + Object.values(parts).reduce((a, b) => a + b, 0);
    const mir = miracleNaturals(player.servant);
    let roll = dice.roll();
    let rerolls = 0;
    while (!auto && player.fatePoints > 0) {
      const c0 = check(roll, mod, mir, dc ?? Infinity);
      // 실패했을 때만 (D-119). 목표가 없는 마력 공급은 결과가 실패·대실패일 때
      const failing = dc !== null ? !c0.success : ['fail', 'fumble'].includes(K['mana.supply_result'].find((b) => c0.roll.total >= b.min)!.result);
      if (!failing) break;
      const own = { ...c0.roll, faction: player.id, stats: [...stats], parts };
      const again = yield* ask<boolean>({ kind: 'reroll', faction: player.id, context: 'action', own, opponent_total: null, opponent_roll: null, dc, fate_points: player.fatePoints }, isBool);
      if (!again) break;
      player.fatePoints -= 1;
      rerolls += 1;
      roll = dice.roll();
    }
    const r = check(roll, mod, mir, dc ?? Infinity);
    const record: RollRecord = { ...r.roll, faction: player.id, stats: [...stats], parts, rerolls };
    return { record, success: r.success };
  }

  /** 민첩 대항 (조우 도주·기습). escaper가 플레이어면 재굴림을 묻는다 */
  function* agiContest(a: FactionState, b: FactionState, allowReroll: FactionState | null) {
    const mod = (f: FactionState) => statSum(f.servant, ['agi']) + (f === player ? rollMod(player.affinity ?? 0) : 0);
    const rolls: Record<string, NaturalRoll> = { [a.id]: dice.roll(), [b.id]: dice.roll() };
    const rerolls: Record<string, number> = { [a.id]: 0, [b.id]: 0 };
    const judge = () => contest({ roll: rolls[a.id]!, modifier: mod(a), miracle: miracleNaturals(a.servant) }, { roll: rolls[b.id]!, modifier: mod(b), miracle: miracleNaturals(b.servant) });
    if (allowReroll === player) {
      const me = player === a ? 'a' : 'b';
      while (player.fatePoints > 0) {
        const r = judge();
        const theirs = r[me === 'a' ? 'b' : 'a'];
        if (!(r[me].total < theirs.total)) break; // 지고 있을 때만 (D-119). 동점은 도주 성공
        const aff = rollMod(player.affinity ?? 0);
        const again = yield* ask<boolean>(
          {
            kind: 'reroll',
            faction: player.id,
            context: 'escape',
            own: { ...r[me], faction: player.id, stats: ['agi'], parts: aff ? { affinity: aff } : {} },
            opponent_total: theirs.total,
            opponent_roll: { ...theirs, faction: (me === 'a' ? b : a).id, stats: ['agi'], parts: {} },
            dc: null,
            fate_points: player.fatePoints,
          },
          isBool,
        );
        if (!again) break;
        player.fatePoints -= 1;
        rerolls[player.id]! += 1;
        rolls[player.id] = dice.roll();
      }
    }
    const r = judge();
    const rec = (f: FactionState, side: 'a' | 'b'): RollRecord => ({
      ...r[side],
      faction: f.id,
      stats: ['agi'],
      parts: f === player && rollMod(player.affinity ?? 0) ? { affinity: rollMod(player.affinity ?? 0) } : {},
      rerolls: rerolls[f.id]!,
    });
    return { winner: r.winner === 'a' ? a : r.winner === 'b' ? b : null, margin: r.margin, records: [rec(a, 'a'), rec(b, 'b')] };
  }

  const clampMana = (v: number) => Math.min(K['mana.max'], v);

  // ── 밤 행동: 이동뿐이다. 자기 칸을 고르면 머문다 (D-112) ──
  function* playerMove(day: number, index: number) {
    const range = reachable(player.tile, moveRange(player.skills));
    const answer = yield* ask<ActionAnswer>({ kind: 'action', time: 'night', day, action_index: index, reachable: [player.tile, ...range.keys()] }, (a): a is ActionAnswer => {
      if (typeof a !== 'object' || a === null || !('action' in a) || a.action !== 'move') return false;
      return a.to === player.tile || range.has(a.to);
    });
    if (answer.to === player.tile) {
      log.emit('waited', [player.id], { faction: player.id });
    } else if (chance(dice, refusalChance(player.affinity ?? 0))) {
      // 명령 거부: 타일 이동을 거부하면 무작위 인접 이동 (D-083)
      log.emit('refused', [player.id], { faction: player.id, command: 'move' });
      const opts = neighbors(player.tile);
      const to = opts[dice.draw(opts.length)]!;
      log.emit('moved', [player.id], { faction: player.id, from: player.tile, to, path: [to] });
      player.tile = to;
    } else {
      log.emit('moved', [player.id], { faction: player.id, from: player.tile, to: answer.to, path: range.get(answer.to)! });
      player.tile = answer.to;
    }
  }

  /** 오늘 칸 보너스 (D-145): 밤을 마친 칸의 역할 */
  const roleBonus = (kind: 'intel' | 'bond' | 'leyline'): number => (tile(player.tile).role === kind ? K['day.role_bonus'][kind] : 0);

  /** 정보 수집 대상 (D-147): 진명을 모르는 적 중 이미 만난 진영 우선, 그중 단계가 가장 낮은 진영에서 무작위 */
  const intelTargets = () => alive().filter((f) => f !== player && (S.intel[f.id] ?? 0) < K['day.intel_mod'].length - 1);

  // ── 낮 행동: 메뉴 1회 (D-145). 판정은 자동, 재굴림 없음 ──
  function* dayAction(day: number) {
    const role = tile(player.tile).role;
    const answer = yield* ask<DayAnswer>(
      { kind: 'day_action', day, tile: player.tile, role, options: ['intel', 'bond'], bonus: { intel: roleBonus('intel'), bond: roleBonus('bond') }, intel_open: intelTargets().length > 0 },
      (a): a is DayAnswer => typeof a === 'object' && a !== null && 'action' in a && (a.action === 'intel' || a.action === 'bond'),
    );
    if (answer.action === 'bond') {
      const dc = K['day.bond_dc'];
      const extra: Record<string, number> = roleBonus('bond') ? { role: roleBonus('bond') } : {};
      log.emit('action_started', [player.id], { faction: player.id, action: 'bond', tile: player.tile, target: null });
      const { record, success } = yield* playerCheck([], extra, dc, true);
      log.emit('bond', [player.id], { faction: player.id, result: success ? 'success' : 'fail', roll: record, dc });
      changeAffinity(K['affinity.delta_bond'][success ? 'success' : 'fail'], 'bond');
      return;
    }
    const targets = intelTargets();
    if (!targets.length) return; // 모두 진명을 안다
    const met = targets.filter((f) => (S.intel[f.id] ?? 0) >= 1);
    const pool0 = met.length ? met : targets;
    const low = Math.min(...pool0.map((f) => S.intel[f.id] ?? 0));
    const pool = pool0.filter((f) => (S.intel[f.id] ?? 0) === low);
    const target = pool[dice.draw(pool.length)]!;
    const from = S.intel[target.id] ?? 0;
    const dc = K['day.intel_dc'][from + 1]!;
    const detect = player.skills?.skills.find((sk) => sk.skill_id === 'sk_presence_detection');
    const extra: Record<string, number> = detect?.rank ? { presence_detection: parseRank(detect.rank).value } : {};
    if (roleBonus('intel')) extra.role = roleBonus('intel');
    log.emit('action_started', [player.id, target.id], { faction: player.id, action: 'intel', tile: player.tile, target: target.id });
    const { record, success } = yield* playerCheck([], extra, dc, true);
    const to = success ? from + 1 : from;
    S.intel[target.id] = to;
    log.emit('intel_gained', [player.id, target.id], { target: target.id, level_from: from, level_to: to, result: success ? 'success' : 'fail', cause: 'intel', roll: record, dc });
  }

  /**
   * 마력 공급 요청 (D-129): 아침에 서번트가 부상·위험이거나 호감도가 높으면 먼저 청한다. 하루 1회, 행동을 쓰지 않는다.
   * 부상 때문에 청한 공급이 보통 이상이면 상태가 1단계 회복된다.
   */
  function* supplyOffer(day: number) {
    const hurt = player.condition !== 'full';
    const trust = (player.affinity ?? 0) >= K['mana.supply_request_affinity'];
    if (!hurt && !trust) return;
    const reason = hurt ? 'hurt' : 'trust';
    const yes = yield* ask<boolean>({ kind: 'supply_offer', reason, condition: player.condition, affinity: player.affinity ?? 0 }, isBool);
    if (!yes) return;
    log.emit('action_started', [player.id], { faction: player.id, action: 'supply', tile: player.tile, target: null });
    // 영맥 칸에서 밤을 마쳤으면 공급 판정 보너스 (D-145)
    const { record } = yield* playerCheck([], roleBonus('leyline') ? { leyline: roleBonus('leyline') } : {}, null);
    const band = K['mana.supply_result'].find((b) => record.total >= b.min)!;
    const before = player.mana;
    player.mana = clampMana(player.mana + band.mana);
    S.suppliedDay = day;
    log.emit('mana_supplied', [player.id], { faction: player.id, result: band.result as SupplyResult, mana_before: before, mana_after: player.mana, roll: record });
    if (reason === 'hurt' && (band.result === 'great' || band.result === 'success' || band.result === 'normal')) {
      const from = player.condition;
      const to = from === 'danger' ? 'hurt' : 'full';
      player.condition = to;
      log.emit('condition_recovered', [player.id], { faction: player.id, from, to, cause: 'supply' });
    }
    changeAffinity(K['affinity.delta_supply'][band.result], 'supply');
  }

  // ── 적 AI 이동 (D-051, D-082): 머무르기와 인접 칸을 같은 확률로.
  //    ai.hunt_from_day일차부터는 ai.hunt_chance 확률로 가장 가까운 진영 쪽으로 (D-149) ──
  const huntStep = (f: FactionState): string | null => {
    const others = alive().filter((o) => o !== f);
    if (!others.length) return null;
    const near = Math.min(...others.map((o) => distance(f.tile, o.tile)));
    if (near === 0) return f.tile;
    const goals = others.filter((o) => distance(f.tile, o.tile) === near);
    const goal = goals[dice.draw(goals.length)]!;
    const steps = neighbors(f.tile).filter((n) => distance(n, goal.tile) < near);
    return steps[dice.draw(steps.length)]!;
  };
  const enemiesMove = (day: number) => {
    for (const f of alive()) {
      if (f.controller !== 'ai') continue;
      const hunt = day >= K['ai.hunt_from_day'] && chance(dice, K['ai.hunt_chance']) ? huntStep(f) : null;
      const opts = [f.tile, ...neighbors(f.tile)];
      const to = hunt ?? opts[dice.draw(opts.length)]!;
      if (to === f.tile) continue;
      log.emit('moved', [f.id], { faction: f.id, from: f.tile, to, path: [to] });
      f.tile = to;
    }
  };

  // ── 전투 ──
  const fighterOf = (f: FactionState, opponent: FactionState): Fighter =>
    createFighter(f.id, f.servant, f.controller, {
      condition: f.condition,
      mana: f.mana,
      seals: f.seals,
      fatePoints: f.fatePoints,
      intelLevel: f === player ? (S.intel[opponent.id] ?? 0) : 0,
      bonus: f === player ? { affinity: rollMod(player.affinity ?? 0) } : NO_BONUS,
      sealRetreats: f.sealRetreats,
      refusal: f === player ? refusalChance(player.affinity ?? 0) : 0,
      temperament: f.master?.temperament ?? null,
      skills: f.skills?.skills ?? [],
    });

  const applyOutcome = (a: FactionState, b: FactionState, o: BattleOutcome) => {
    for (const [f, r] of [[a, o.a], [b, o.b]] as const) {
      f.condition = r.condition;
      f.mana = r.mana;
      f.seals = r.seals;
      f.fatePoints = r.fatePoints;
      f.sealRetreats = r.sealRetreats;
      if (f === player) S.intel[(f === a ? b : a).id] = r.intelLevel;
    }
  };

  function* fight(a: FactionState, b: FactionState, battleTile: string, isFinal: boolean, ambusher: FactionState | null) {
    S.battleSeq += 1;
    const battleId = `bt_${String(S.battleSeq).padStart(3, '0')}`;
    const mine = a === player || b === player;
    const input: BattleInput = {
      captureForecast: mine,
      battleId,
      a: fighterOf(a, b),
      b: fighterOf(b, a),
      terrain: tile(battleTile).terrain,
      tile: battleTile,
      isFinal,
      ambusher: ambusher === a ? ('a' as const) : ambusher === b ? ('b' as const) : null,
      leyline: tile(battleTile).role === 'leyline',
      ...(mine ? { onChoice: react } : {}),
    };
    const outcome = mine ? yield* passBattle(battle(input, dice, log)) : runBattle(input, dice, log, aiPolicy);
    applyOutcome(a, b, outcome);
    // 결판 없는 전투의 보상 (D-147): 무승부이거나 적이 도주했으면 그 적 정보 +1단계
    if (mine && player.alive) {
      const enemy = a === player ? b : a;
      if (outcome.result === 'draw' || (outcome.result === 'escape' && outcome.escaped === enemy.id)) raiseIntel(enemy, (S.intel[enemy.id] ?? 0) + 1, 'battle');
    }
    return outcome;
  }

  /** 전투 제너레이터의 Prompt를 그대로 밖으로 넘긴다 */
  function* passBattle(gen: Generator<Prompt, BattleOutcome, PromptAnswer>): Generator<RunPrompt, BattleOutcome, RunAnswer> {
    let step = gen.next();
    while (!step.done) {
      const answer = yield step.value;
      step = gen.next(answer as PromptAnswer);
    }
    return step.value;
  }

  // ── 조우 (day-loop.md §6) ──
  const wantsFight = (f: FactionState, opponent: FactionState): boolean => {
    const t = f.master!.temperament;
    if (t === 'cunning') {
      const mine = statSum(f.servant, ['str', 'end', 'agi', 'mana', 'luck', 'np']);
      const theirs = statSum(opponent.servant, ['str', 'end', 'agi', 'mana', 'luck', 'np']);
      const win = 1 / (1 + Math.pow(10, (theirs - mine) / K['ai.elo_d']));
      if (win >= K['ai.cunning_win_rate']) return true;
    }
    return chance(dice, K['ai.accept'][t]);
  };

  function* encounter(a: FactionState, b: FactionState, at: string, bystanders: FactionState[]) {
    // 기습 (D-099, D-109): 민첩 대항에서 day.ambush_margin 이상 차이로 이긴 쪽
    const amb = yield* agiContest(a, b, null);
    const ambusher = amb.winner && amb.margin >= K['day.ambush_margin'] ? amb.winner : null;
    log.emit('encounter', [a.id, b.id], {
      tile: at,
      terrain: tile(at).terrain,
      factions: [a.id, b.id],
      bystanders: bystanders.map((f) => f.id),
      ambusher: ambusher?.id ?? null,
      ambush_rolls: amb.records,
    });
    // 조우하면 상대 클래스를 안다 (D-147)
    if (a === player || b === player) raiseIntel(a === player ? b : a, 1, 'encounter');

    const choices: Record<string, 'fight' | 'flee'> = {};
    for (const f of [a, b]) {
      if (f === player) {
        const enemy = f === a ? b : a;
        let c = yield* ask<'fight' | 'flee'>({ kind: 'encounter', enemy: enemy.id, tile: at, ambusher: ambusher?.id ?? null, forecast: { battleId: 'bt_forecast', a: fighterOf(a, b), b: fighterOf(b, a), terrain: tile(at).terrain, tile: at, ambusher: ambusher === a ? 'a' : ambusher === b ? 'b' : null, leyline: tile(at).role === 'leyline' } }, (x): x is 'fight' | 'flee' => x === 'fight' || x === 'flee');
        // 명령 거부 (D-083): 전투 개시·도주를 거부하면 반대로 한다. 거부당한 명령에는 반응하지 않는다 (D-150)
        if (chance(dice, refusalChance(player.affinity ?? 0))) {
          log.emit('refused', [player.id], { faction: player.id, command: c === 'fight' ? 'fight' : 'flee' });
          c = c === 'fight' ? 'flee' : 'fight';
        } else react(player.id, c === 'fight' ? 'encounter_fight' : 'encounter_flee');
        choices[f.id] = c;
      } else choices[f.id] = wantsFight(f, f === a ? b : a) ? 'fight' : 'flee';
    }
    log.emit('encounter_decided', [a.id, b.id], { choices });

    const fleeing = [a, b].filter((f) => choices[f.id] === 'flee');
    if (fleeing.length === 2) return null;
    if (fleeing.length === 1) {
      // 도주를 골라도 상대가 전투를 원하면 민첩 대항. 동점은 도주 성공 (D-085, D-100)
      const runner = fleeing[0]!;
      const chaser = runner === a ? b : a;
      const r = yield* agiContest(runner, chaser, runner === player ? player : null);
      const success = r.winner !== chaser;
      log.emit('escape_attempted', [runner.id], { battle_id: null, faction: runner.id, context: 'encounter', success, rolls: r.records });
      if (success) return null;
    }
    return yield* fight(a, b, at, false, ambusher);
  }

  function* afterBattle(o: BattleOutcome, isFinal: boolean, since: number) {
    if (o.result === 'escape_failed') {
      eliminate(S.factions[o.loser!]!, 'escape_failed', o.winner);
      return;
    }
    if (o.result !== 'win' || !o.dead) return;
    const dead = S.factions[o.dead]!;
    const winner = S.factions[o.winner!]!;
    const refused = log.events.slice(since).some((e) => e.type === 'refused' && e.data.command === 'escape' && e.data.faction === dead.id);
    if (dead === player) return eliminate(player, refused ? 'refused_escape' : 'killed', winner.id);
    if (isFinal) return eliminate(dead, 'killed', winner.id);
    if (winner === player) {
      // 전투 후 선택: 처치 / 방면 (affinity.md §3.5)
      const choice = yield* ask<'execute' | 'release'>({ kind: 'post_choice', target: dead.id }, (x): x is 'execute' | 'release' => x === 'execute' || x === 'release');
      log.emit('post_choice', [player.id, dead.id], { faction: player.id, target: dead.id, choice });
      changeAffinity(postChoiceDelta(player.servant, choice), choice);
      return eliminate(dead, choice === 'execute' ? 'executed' : 'released', player.id);
    }
    // 적이 적을 이기면 항상 처치 (D-094)
    eliminate(dead, 'executed', winner.id);
  }

  function* resolveEncounters() {
    const byTile = new Map<string, FactionState[]>();
    for (const f of alive()) byTile.set(f.tile, [...(byTile.get(f.tile) ?? []), f]);
    for (const at of [...byTile.keys()].sort()) {
      const here = byTile.get(at)!.filter((f) => f.alive);
      if (here.length < 2) continue;
      // 3진영 이상: 무작위 2진영만 전투 (D-052)
      const pool = [...here];
      const first = pool.splice(dice.draw(pool.length), 1)[0]!;
      const second = pool.splice(dice.draw(pool.length), 1)[0]!;
      const [a, b] = second === player ? [second, first] : [first, second];
      const since = log.events.length;
      const outcome = yield* encounter(a, b, at, pool);
      if (outcome) yield* afterBattle(outcome, false, since);
      if (a !== player && b !== player)
        log.emit('npc_battle_resolved', [a.id, b.id], {
          battle_id: outcome ? `bt_${String(S.battleSeq).padStart(3, '0')}` : '',
          tile: at,
          factions: [a.id, b.id],
          result: outcome ? outcome.result : 'none',
          winner: outcome?.winner ?? null,
          loser: outcome?.loser ?? null,
        });
    }
  }

  // ── 7일 루프 ──
  const over = () => alive().length <= 1;
  for (let day = 1; day <= K['day.days'] && !over(); day++) {
    log.clock = { day, time: 'day', action: 0 };
    log.emit('day_started', [], { day });
    if (playerActive()) yield* supplyOffer(day);
    for (let i = 1; i <= K['day.actions_day'] && !over(); i++) {
      log.clock = { day, time: 'day', action: i };
      if (playerActive()) yield* dayAction(day);
      enemiesMove(day);
    }
    if (over()) break;

    log.clock = { day, time: 'night', action: 0 };
    log.emit('night_started', [], { day });
    for (const f of alive()) {
      // 밤 진입 시 마력 자연 회복 (mana.md §3.1). 플레이어 서번트는 회복하지 않는다: 마력은 마력 공급으로만 (D-111)
      if (f === player) continue;
      const regen = manaRegen(f.servant);
      const after = clampMana(f.mana + regen);
      if (after === f.mana) continue;
      log.emit('mana_regenerated', [f.id], { faction: f.id, amount: after - f.mana, mana_after: after });
      f.mana = after;
    }
    for (let i = 1; i <= K['day.actions_night'] && !over(); i++) {
      log.clock = { day, time: 'night', action: i };
      if (playerActive()) yield* playerMove(day, i);
      enemiesMove(day);
      yield* resolveEncounters();
    }
    if (over()) break;

    // 밤이 끝날 때: 배신 판정 (affinity.md §3.4) → 상태 1단계 회복 (combat.md §3.4-6)
    log.clock = { day, time: 'night', action: K['day.actions_night'] + 1 };
    if (playerActive() && chance(dice, betrayalChance(player.affinity ?? 0))) {
      log.emit('betrayal_attempted', [player.id], { faction: player.id });
      const block = player.seals > 0 ? yield* ask<boolean>({ kind: 'betrayal_block', seals: player.seals }, isBool) : false;
      if (block) {
        player.seals -= 1;
        log.emit('seal_used', [player.id], { battle_id: null, faction: player.id, purpose: 'block_betrayal', seals_left: player.seals });
        log.emit('betrayal_blocked', [player.id], { faction: player.id, seals_left: player.seals });
      } else eliminate(player, 'betrayal', null); // 서번트에게 살해당하고 패배 (D-108)
    }
    for (const f of alive()) {
      const i = ['full', 'hurt', 'danger'].indexOf(f.condition);
      const to = (['full', 'hurt', 'danger'] as const)[Math.max(0, i - K['combat.night_recovery'])]!;
      if (to === f.condition) continue;
      log.emit('condition_recovered', [f.id], { faction: f.id, from: f.condition, to, cause: 'night' });
      f.condition = to;
    }
  }

  // ── 강제 전투 (combat.md §7, D-103) ──
  if (!over()) {
    const center = centerTileId();
    log.clock = { day: K['day.days'], time: 'final', action: 0 };
    log.emit('final_started', alive().map((f) => f.id), { tile: center, factions: alive().map((f) => f.id) });
    for (const f of alive()) f.tile = center;
    let round = 0;
    while (!over()) {
      round += 1;
      log.clock = { day: K['day.days'], time: 'final', action: round };
      const pool = alive();
      const bye = pool.length % 2 === 1 ? pool.splice(dice.draw(pool.length), 1)[0]! : null;
      const order = shuffle(pool, rng);
      const pairs: [FactionState, FactionState][] = [];
      for (let i = 0; i < order.length; i += 2) {
        const x = order[i]!, y = order[i + 1]!;
        pairs.push(y === player ? [y, x] : [x, y]);
      }
      log.emit('final_battle_bracket', [], { round, pairs: pairs.map(([x, y]) => [x.id, y.id]), bye: bye?.id ?? null });
      for (const [a, b] of pairs) {
        const since = log.events.length;
        const o = yield* fight(a, b, center, true, null);
        yield* afterBattle(o, true, since);
      }
    }
  }

  const winner = alive()[0] ?? null;
  const result = winner === player ? 'victory' : 'defeat';
  log.emit('run_ended', winner ? [winner.id] : [], { result, winner: winner?.id ?? null, player_out_at: playerOutAt });
  return { result, winner: winner?.id ?? null, state: S };
}

// ── 도우미 ──

const isBool = (a: RunAnswer): a is boolean => typeof a === 'boolean';

function* ask<T extends RunAnswer>(p: RunPrompt, valid: (a: RunAnswer) => a is T): Generator<RunPrompt, T, RunAnswer> {
  const a = yield p;
  if (!valid(a)) throw new TypeError(`${p.kind}에 맞지 않는 답: ${JSON.stringify(a)}`);
  return a;
}

const manaInit = (s: ServantProfile) => manaByRank(s).init;
const manaRegen = (s: ServantProfile) => manaByRank(s).regen;

/** 적 AI 전투 정책: 전투 제너레이터가 적 AI에게는 묻지 않으므로 호출되지 않는다 */
const aiPolicy = (p: Prompt): PromptAnswer => {
  throw new Error(`적 AI 전투에서 예상하지 못한 선택: ${p.kind}`);
};

export type { BattleDice };
