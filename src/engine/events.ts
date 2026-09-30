// 이벤트 로그 (docs/systems/narrative-engine.md §3, D-096). 게임 상태 변화는 모두 여기에 기록한다.
// 서술 엔진·화면·에필로그·재현·커버리지 시뮬레이터가 이 로그를 읽는다. 로그만으로 상태를 다시 만들 수 있어야 한다 (view.ts).
import type { BattleInput } from './combat';
import type { PhaseId, Terrain } from '../data/schema';
import type { RollResult } from './dice';

export type TimeOfDay = 'day' | 'night' | 'final';
/** 체력 상태 (D-014) */
export type Condition = 'full' | 'hurt' | 'danger';
export type Side = 'a' | 'b';
/** 호감도 단계 (affinity.md §3.2) */
export type AffinityTier = 'hostile' | 'wary' | 'neutral' | 'friendly' | 'loyal';
export type SupplyResult = 'great' | 'success' | 'normal' | 'fail' | 'fumble';

export interface RollRecord extends RollResult {
  faction: string;
  /** 사용한 스탯 (합산 전) */
  stats: string[];
  /** 스탯 외 보정 내역 (affinity, intel, ambush, role, skill_id …) */
  parts: Record<string, number>;
  /** 운명점으로 재굴림한 횟수 */
  rerolls: number;
}

export interface FactionSetup {
  faction: string;
  servant_id: string;
  master_id: string | null;
  controller: 'player' | 'ai';
  tile: string;
  condition: Condition;
  mana: number;
  seals: number;
  fate_points: number;
  /** 플레이어 서번트만 */
  affinity: number | null;
}

export type EliminationCause = 'killed' | 'executed' | 'released' | 'escape_failed' | 'betrayal' | 'refused_escape';

/** 종류별 data (§3.2) */
export interface EventDataMap {
  // 판
  run_started: { seed: number; player: string; summon: 'random' | 'catalyst'; factions: FactionSetup[] };
  run_ended: { result: 'victory' | 'defeat'; winner: string | null; player_out_at: number | null };
  // 시간
  day_started: { day: number };
  night_started: { day: number };
  final_started: { tile: string; factions: string[] };
  /** cause: 밤 진입 시 회복 (D-167, D-169) */
  condition_recovered: { faction: string; from: Condition; to: Condition; cause: 'night' };
  mana_regenerated: { faction: string; amount: number; mana_after: number };
  // 낮·밤 행동
  /** 판정이 있는 플레이어 행동의 시작. 도입 나레이션이 주사위(재굴림 질문 포함)보다 먼저 나오게 한다 (D-141) */
  action_started: { faction: string; action: 'bond' | 'intel' | 'supply'; tile: string; target: string | null };
  /** cause: 정보 수집 / 보구 개방 / 조우 자동 공개 / 결판 없는 전투 (D-147) */
  intel_gained: { target: string; level_from: number; level_to: number; result: 'success' | 'fail'; cause: 'intel' | 'np' | 'encounter' | 'battle'; roll: RollRecord | null; dc: number | null };
  mana_supplied: { faction: string; result: SupplyResult; mana_before: number; mana_after: number; roll: RollRecord };
  bond: { faction: string; result: 'success' | 'fail'; roll: RollRecord; dc: number };
  moved: { faction: string; from: string; to: string; path: string[] };
  waited: { faction: string };
  // 관계
  affinity_changed: { faction: string; from: number; to: number; tier_from: AffinityTier; tier_to: AffinityTier; cause: string };
  refused: { faction: string; command: 'move' | 'escape' | 'flee' | 'fight' };
  betrayal_attempted: { faction: string };
  betrayal_blocked: { faction: string; seals_left: number };
  // 조우
  encounter: { tile: string; terrain: Terrain; factions: [string, string]; bystanders: string[]; ambusher: string | null; ambush_rolls: RollRecord[] };
  encounter_decided: { choices: Record<string, 'fight' | 'flee'> };
  // 전투
  battle_started: { forecast?: BattleInput; battle_id: string; tile: string | null; terrain: Terrain; is_final: boolean; ambusher: string | null; sides: [string, string]; /** 기적을 쓸 수 있는 쪽 (D-166). 스탯이 같으면 null */ underdog: string | null };
  phase_started: { forecast?: BattleInput; battle_id: string; phase_index: number; phase_id: PhaseId; attacker: string; defender: string };
  np_opened: { battle_id: string; phase_index: number; faction: string; seal: boolean; mana_before: number; mana_after: number };
  /** 약점 공략 (D-148): 이 국면을 phase_id로 끌고 간다 */
  weakness_used: { battle_id: string; phase_index: number; faction: string; target: string; phase_id: PhaseId };
  phase_rolled: { battle_id: string; phase_index: number; phase_id: PhaseId; kind: 'contest' | 'solo'; rolls: RollRecord[]; dc: number | null };
  phase_resolved: {
    battle_id: string;
    phase_index: number;
    phase_id: PhaseId;
    skipped: boolean;
    /** 일방 보구를 막아 냄: 보구를 연 쪽이 졌지만 피해 없음 (D-120) */
    defended: boolean;
    winner: string | null;
    loser: string | null;
    /** 대항 판정의 판정값 차이 (단독 판정·동점이면 0) */
    margin: number;
    drop: 0 | 1 | 2;
    miracle: boolean;
    condition_from: Condition | null;
    /** below = 위험에서 패배해 쓰러짐. 위험 진입에서 멈추면 danger (D-134, D-137) */
    condition_to: Condition | 'below' | null;
  };
  condition_changed: { battle_id: string; faction: string; from: Condition; to: Condition | 'dead' };
  seal_used: { battle_id: string | null; faction: string; purpose: 'np' | 'escape' | 'block_betrayal'; seals_left: number };
  /**
   * 스킬 자동 발동 (D-142). 판정 보정은 그 판정의 parts에도 들어간다 (키 = skill_id, 상대에게 건 것은 foe:skill_id).
   * target = 효과를 받은 진영. amount = 보정·마력 변화량 (무효·버팀은 0). mana_after = 마력 변화가 있을 때만
   */
  skill_triggered: {
    battle_id: string;
    phase_index: number;
    faction: string;
    skill_id: string;
    rank: string | null;
    effect: 'roll_mod' | 'event_negate' | 'resource_change' | 'condition_guard';
    amount: number;
    target: string;
    mana_after: number | null;
  };
  /** 위험에 들어섰을 때의 선택 (D-134) */
  danger_decided: { battle_id: string; faction: string; choice: 'fight' | 'seal' | 'run' };
  escape_attempted: { battle_id: string | null; faction: string; context: 'battle' | 'encounter'; success: boolean; rolls: RollRecord[] };
  battle_ended: {
    battle_id: string;
    result: 'win' | 'draw' | 'escape' | 'escape_failed';
    winner: string | null;
    loser: string | null;
    dead: string | null;
    /** 도주한 진영 */
    escaped: string | null;
    phases: number;
  };
  post_choice: { faction: string; target: string; choice: 'execute' | 'release' };
  eliminated: { faction: string; cause: EliminationCause; by: string | null };
  // 세계
  npc_battle_resolved: { battle_id: string; tile: string; factions: [string, string]; result: 'win' | 'draw' | 'escape' | 'escape_failed' | 'none'; winner: string | null; loser: string | null; /** 소멸한 진영 (맵 흔적 연출, D-166) */ dead: string | null };
  final_battle_bracket: { round: number; pairs: [string, string][]; bye: string | null };
}
export type EventType = keyof EventDataMap;

export interface GameEvent<T extends EventType = EventType> {
  seq: number;
  day: number;
  time: TimeOfDay;
  action: number;
  type: T;
  actors: string[];
  data: EventDataMap[T];
}
export type AnyEvent = { [T in EventType]: GameEvent<T> }[EventType];

export interface Clock {
  day: number;
  time: TimeOfDay;
  action: number;
}

export class EventLog {
  readonly events: AnyEvent[] = [];
  clock: Clock;
  constructor(clock: Clock = { day: 1, time: 'night', action: 1 }) {
    this.clock = { ...clock };
  }
  emit<T extends EventType>(type: T, actors: string[], data: EventDataMap[T]): GameEvent<T> {
    const e: GameEvent<T> = { seq: this.events.length + 1, ...this.clock, type, actors, data };
    this.events.push(e as unknown as AnyEvent);
    return e;
  }
  ofType<T extends EventType>(type: T): GameEvent<T>[] {
    return this.events.filter((e) => e.type === type) as unknown as GameEvent<T>[];
  }
}
