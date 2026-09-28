// 한 판 진행 (docs/00-overview.md §3, systems/day-loop.md, combat.md §7·§8, affinity.md).
// 메인 → 소환 → 7일 낮·밤 루프 → 강제 전투(토너먼트) → 우승 / 패배 (D-102).
// 판 전체가 하나의 제너레이터다. 플레이어가 고를 때마다 RunPrompt를 내보내고 답을 받아 이어 간다.
// 플레이어가 탈락하면 같은 제너레이터가 적 AI 규칙만으로 끝까지 진행한다 (패배 빨리감기, D-043).
import { K } from '../data/constants';
import type { MasterProfile, ServantProfile, ServantSkillsFile, StatId } from '../data/schema';
import { applyDelta, betrayalChance, initialAffinity, postChoiceDelta, refusalChance, rollMod, tierOf } from './affinity';
import { battle, type BattleOutcome, type BattleDice, chance, createFighter, type Fighter, NO_BONUS, type Prompt, type PromptAnswer, rngDice, runBattle } from './combat';
import { check, contest, type NaturalRoll } from './dice';
import { type Condition, EventLog, type FactionSetup, type RollRecord, type SupplyResult } from './events';
import { allTileIds, centerTileId, moveRange, neighbors, reachable, tile } from './map';
import { createRng, deriveSeed, type Rng } from './rng';
import { manaByRank, miracleNaturals, parseRank, statSum } from './stats';

export const PLAYER_FACTION = 'fc_player';
/** 낮 행동은 이동뿐이다. 교류·정보 수집·진지 작성은 칸 역할로, 마력 공급은 서번트의 요청으로 벌어진다 (D-128, D-129) */
export type TileRole = 'leyline' | 'intel' | 'bond';

export type RunPrompt =
  | Prompt
  /** reachable에는 자기 칸이 들어 있다 (머무르기, D-112) */
  | { kind: 'action'; time: 'day' | 'night'; day: number; action_index: number; reachable: string[] }
  /** 영맥 칸: 진지를 세울까 (camp = 지금 진지 칸) */
  | { kind: 'camp_offer'; tile: string; camp: string | null }
  /** 아침: 서번트가 마력 공급을 청한다 */
  | { kind: 'supply_offer'; reason: 'hurt' | 'trust'; condition: Condition; affinity: number }
  | { kind: 'encounter'; enemy: string; tile: string; ambusher: string | null }
  | { kind: 'post_choice'; target: string }
  | { kind: 'betrayal_block'; seals: number };
export type ActionAnswer = { action: 'move'; to: string };
export type RunAnswer = PromptAnswer | ActionAnswer | 'fight' | 'flee' | 'execute' | 'release';

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
}

export interface RunState {
  plan: RunPlan;
  factions: Record<string, FactionState>;
  /** 플레이어가 아는 적 진영 정보 단계 (day-loop.md §4.3) */
  intel: Record<string, number>;
  camp: string | null;
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
  };
  const S: RunState = { plan, factions: { [PLAYER_FACTION]: player }, intel: {}, camp: null, suppliedDay: 0, battleSeq: 0 };
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

  /** 플레이어의 단독 판정 (낮 행동). 운명점 재굴림을 묻는다 */
  function* playerCheck(stats: readonly StatId[], extra: Record<string, number>, dc: number | null) {
    const parts: Record<string, number> = { ...extra };
    const aff = rollMod(player.affinity ?? 0);
    if (aff) parts.affinity = aff;
    const mod = statSum(player.servant, stats) + Object.values(parts).reduce((a, b) => a + b, 0);
    const mir = miracleNaturals(player.servant);
    let roll = dice.roll();
    let rerolls = 0;
    while (player.fatePoints > 0) {
      const c0 = check(roll, mod, mir, dc ?? Infinity);
      // 실패했을 때만 (D-119). 목표가 없는 마력 공급은 결과가 실패·대실패일 때
      const failing = dc !== null ? !c0.success : ['fail', 'fumble'].includes(K['mana.supply_result'].find((b) => c0.roll.total >= b.min)!.result);
      if (!failing) break;
      const own = { ...c0.roll, stats: [...stats], parts };
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
            own: { ...r[me], stats: ['agi'], parts: aff ? { affinity: aff } : {} },
            opponent_total: theirs.total,
            opponent_roll: { ...theirs, stats: ['agi'], parts: {} },
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

  // ── 플레이어 행동: 낮·밤 모두 이동뿐이다. 자기 칸을 고르면 머문다 (D-112) ──
  //    낮에는 도착하거나 머문 칸의 역할이 자동으로 벌어진다 (D-128)
  function* playerAction(time: 'day' | 'night', day: number, index: number) {
    const range = reachable(player.tile, moveRange(player.skills));
    const answer = yield* ask<ActionAnswer>({ kind: 'action', time, day, action_index: index, reachable: [player.tile, ...range.keys()] }, (a): a is ActionAnswer => {
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
    if (time === 'day' && player.alive) yield* tileEvent();
  }

  /** 칸 역할 (D-128): 교류 → 교류 판정, 정보 → 정보 수집 판정, 영맥 → 진지를 세울지 묻는다 */
  function* tileEvent() {
    const role = tile(player.tile).role;
    if (role === 'bond') {
      const dc = K['day.bond_dc'];
      const { record, success } = yield* playerCheck([], {}, dc);
      log.emit('bond', [player.id], { faction: player.id, result: success ? 'success' : 'fail', roll: record, dc });
      changeAffinity(K['affinity.delta_bond'][success ? 'success' : 'fail'], 'bond');
    } else if (role === 'intel') {
      // 정보 수집 (D-107): 정보 단계가 가장 낮은 적 진영 중 무작위 1 (D-109). 모두 진명을 알면 아무 일도 없다
      const targets = alive().filter((f) => f !== player && (S.intel[f.id] ?? 0) < 3);
      if (!targets.length) return;
      const low = Math.min(...targets.map((f) => S.intel[f.id] ?? 0));
      const pool = targets.filter((f) => (S.intel[f.id] ?? 0) === low);
      const target = pool[dice.draw(pool.length)]!;
      const from = S.intel[target.id] ?? 0;
      const dc = K['day.intel_dc'][from + 1]!;
      const detect = player.skills?.skills.find((sk) => sk.skill_id === 'sk_presence_detection');
      const extra: Record<string, number> = detect?.rank ? { presence_detection: parseRank(detect.rank).value } : {};
      const { record, success } = yield* playerCheck([], extra, dc);
      const to = success ? from + 1 : from;
      S.intel[target.id] = to;
      log.emit('intel_gained', [player.id, target.id], { target: target.id, level_from: from, level_to: to, result: success ? 'success' : 'fail', cause: 'intel', roll: record, dc });
    } else {
      // 영맥: 진지 작성 (D-082, D-109). 이미 진지인 칸이면 묻지 않는다
      if (S.camp === player.tile) return;
      const yes = yield* ask<boolean>({ kind: 'camp_offer', tile: player.tile, camp: S.camp }, isBool);
      if (!yes) return;
      const dc = K['day.craft_dc'];
      const { record, success } = yield* playerCheck(['mana'], {}, dc);
      if (success) S.camp = player.tile;
      log.emit('crafted', [player.id], { faction: player.id, tile: player.tile, result: success ? 'success' : 'fail', roll: record, dc });
    }
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
    const { record } = yield* playerCheck([], {}, null);
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

  // ── 적 AI 이동 (D-051, D-082): 머무르기와 인접 칸을 같은 확률로 ──
  const enemiesMove = () => {
    for (const f of alive()) {
      if (f.controller !== 'ai') continue;
      const opts = [f.tile, ...neighbors(f.tile)];
      const to = opts[dice.draw(opts.length)]!;
      if (to === f.tile) continue;
      log.emit('moved', [f.id], { faction: f.id, from: f.tile, to, path: [to] });
      f.tile = to;
    }
  };

  // ── 전투 ──
  const fighterOf = (f: FactionState, opponent: FactionState, battleTile: string): Fighter =>
    createFighter(f.id, f.servant, f.controller, {
      condition: f.condition,
      mana: f.mana,
      seals: f.seals,
      fatePoints: f.fatePoints,
      bonus:
        f === player
          ? { affinity: rollMod(player.affinity ?? 0), intel: K['day.intel_mod'][S.intel[opponent.id] ?? 0]!, camp: S.camp === battleTile ? K['day.camp_bonus'] : 0 }
          : NO_BONUS,
      refusal: f === player ? refusalChance(player.affinity ?? 0) : 0,
      temperament: f.master?.temperament ?? null,
    });

  const applyOutcome = (a: FactionState, b: FactionState, o: BattleOutcome) => {
    for (const [f, r] of [[a, o.a], [b, o.b]] as const) {
      f.condition = r.condition;
      f.mana = r.mana;
      f.seals = r.seals;
      f.fatePoints = r.fatePoints;
    }
  };

  function* fight(a: FactionState, b: FactionState, battleTile: string, isFinal: boolean, ambusher: FactionState | null) {
    S.battleSeq += 1;
    const battleId = `bt_${String(S.battleSeq).padStart(3, '0')}`;
    const before = log.events.length;
    const input = {
      battleId,
      a: fighterOf(a, b, battleTile),
      b: fighterOf(b, a, battleTile),
      terrain: tile(battleTile).terrain,
      tile: battleTile,
      isFinal,
      ambusher: ambusher === a ? ('a' as const) : ambusher === b ? ('b' as const) : null,
    };
    const outcome = a === player || b === player ? yield* passBattle(battle(input, dice, log)) : runBattle(input, dice, log, aiPolicy);
    applyOutcome(a, b, outcome);
    // 플레이어 앞에서 보구를 연 적은 진명이 공개된다 (D-067)
    if (a === player || b === player) {
      const enemy = a === player ? b : a;
      const opened = log.events.slice(before).some((e) => e.type === 'np_opened' && e.data.faction === enemy.id);
      if (opened && (S.intel[enemy.id] ?? 0) < 3) {
        const from = S.intel[enemy.id] ?? 0;
        S.intel[enemy.id] = 3;
        log.emit('intel_gained', [player.id, enemy.id], { target: enemy.id, level_from: from, level_to: 3, result: 'success', cause: 'np', roll: null, dc: null });
      }
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

    const choices: Record<string, 'fight' | 'flee'> = {};
    for (const f of [a, b]) {
      if (f === player) {
        const enemy = f === a ? b : a;
        let c = yield* ask<'fight' | 'flee'>({ kind: 'encounter', enemy: enemy.id, tile: at, ambusher: ambusher?.id ?? null }, (x): x is 'fight' | 'flee' => x === 'fight' || x === 'flee');
        // 명령 거부 (D-083): 전투 개시·도주를 거부하면 반대로 한다
        if (chance(dice, refusalChance(player.affinity ?? 0))) {
          log.emit('refused', [player.id], { faction: player.id, command: c === 'fight' ? 'fight' : 'flee' });
          c = c === 'fight' ? 'flee' : 'fight';
        }
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
      if (playerActive()) yield* playerAction('day', day, i);
      enemiesMove();
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
      if (playerActive()) yield* playerAction('night', day, i);
      enemiesMove();
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
