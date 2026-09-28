// 이벤트 로그 (docs/systems/narrative-engine.md §3, D-096). 게임 상태 변화는 모두 여기에 기록한다.
// 서술 엔진·화면·에필로그·재현·커버리지 시뮬레이터가 이 로그를 읽는다. 로그만으로 상태를 다시 만들 수 있어야 한다 (view.ts).
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
  /** 스탯 외 보정 내역 (affinity, intel, camp, seal, ambush) */
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
  /** cause: 밤이 지나 회복 / 부상 때 받은 마력 공급 (D-129) */
  condition_recovered: { faction: string; from: Condition; to: Condition; cause: 'night' | 'supply' };
  mana_regenerated: { faction: string; amount: number; mana_after: number };
  // 낮·밤 행동
  intel_gained: { target: string; level_from: number; level_to: number; result: 'success' | 'fail'; cause: 'intel' | 'np'; roll: RollRecord | null; dc: number | null };
  mana_supplied: { faction: string; result: SupplyResult; mana_before: number; mana_after: number; roll: RollRecord };
  bond: { faction: string; result: 'success' | 'fail'; roll: RollRecord; dc: number };
  crafted: { faction: string; tile: string; result: 'success' | 'fail'; roll: RollRecord; dc: number };
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
  battle_started: { battle_id: string; tile: string | null; terrain: Terrain; is_final: boolean; ambusher: string | null; sides: [string, string] };
  phase_started: { battle_id: string; phase_index: number; phase_id: PhaseId; attacker: string; defender: string };
  np_opened: { battle_id: string; phase_index: number; faction: string; seal: boolean; mana_before: number; mana_after: number };
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
    /** below = `위험` 아래로 떨어짐 (도주 또는 사망) */
    condition_to: Condition | 'below' | null;
  };
  condition_changed: { battle_id: string; faction: string; from: Condition; to: Condition | 'dead' };
  seal_used: { battle_id: string | null; faction: string; purpose: 'np' | 'buff' | 'escape' | 'block_betrayal'; seals_left: number };
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
  npc_battle_resolved: { battle_id: string; tile: string; factions: [string, string]; result: 'win' | 'draw' | 'escape' | 'escape_failed' | 'none'; winner: string | null; loser: string | null };
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
