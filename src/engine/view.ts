// 이벤트 로그 → 현재 상태 (읽기 전용 보기). 화면과 서술 엔진이 쓴다.
// 이벤트를 하나씩 재생하므로, 화면은 텍스트 출력 속도에 맞춰 상태를 갱신할 수 있다.
import type { AnyEvent, Condition, TimeOfDay } from './events';
import { INTEL } from './intel';

export interface FactionView {
  id: string;
  servant_id: string;
  master_id: string | null;
  controller: 'player' | 'ai';
  tile: string;
  condition: Condition;
  mana: number;
  seals: number;
  fatePoints: number;
  affinity: number | null;
  alive: boolean;
  out: string | null;
}

export interface BattleView {
  id: string;
  sides: [string, string];
  tile: string | null;
  isFinal: boolean;
  phaseIndex: number;
}

export interface RunView {
  seed: number;
  player: string;
  day: number;
  time: TimeOfDay;
  action: number;
  factions: Record<string, FactionView>;
  /** 플레이어가 아는 적 정보 단계 */
  intel: Record<string, number>;
  suppliedDay: number;
  battle: BattleView | null;
  final: { round: number; pairs: [string, string][]; bye: string | null } | null;
  ended: { result: 'victory' | 'defeat'; winner: string | null } | null;
  /** 탈락 순서 */
  eliminated: { faction: string; cause: string; by: string | null; day: number }[];
}

export function emptyView(): RunView {
  return { seed: 0, player: '', day: 1, time: 'day', action: 0, factions: {}, intel: {}, suppliedDay: 0, battle: null, final: null, ended: null, eliminated: [] };
}

/** 이벤트 하나를 반영한 새 보기를 돌려준다 (입력은 바꾸지 않는다) */
export function applyEvent(prev: RunView, e: AnyEvent): RunView {
  const v: RunView = { ...prev, factions: { ...prev.factions }, intel: { ...prev.intel }, day: e.day, time: e.time, action: e.action };
  const f = (id: string) => (v.factions[id] = { ...v.factions[id]! });
  const spendRerolls = (rolls: { faction: string; rerolls: number }[]) => {
    for (const r of rolls) if (r.rerolls) f(r.faction).fatePoints -= r.rerolls;
  };
  switch (e.type) {
    case 'run_started':
      v.seed = e.data.seed;
      v.player = e.data.player;
      v.factions = {};
      for (const s of e.data.factions) {
        v.factions[s.faction] = {
          id: s.faction,
          servant_id: s.servant_id,
          master_id: s.master_id,
          controller: s.controller,
          tile: s.tile,
          condition: s.condition,
          mana: s.mana,
          seals: s.seals,
          fatePoints: s.fate_points,
          affinity: s.affinity,
          alive: true,
          out: null,
        };
        if (s.faction !== e.data.player) v.intel[s.faction] = 0;
      }
      break;
    case 'moved':
      f(e.data.faction).tile = e.data.to;
      break;
    case 'final_started':
      for (const id of e.data.factions) f(id).tile = e.data.tile;
      break;
    case 'condition_recovered':
      f(e.data.faction).condition = e.data.to;
      break;
    case 'condition_changed':
      if (e.data.to !== 'dead') f(e.data.faction).condition = e.data.to;
      break;
    case 'mana_regenerated':
      f(e.data.faction).mana = e.data.mana_after;
      break;
    case 'mana_supplied':
      f(e.data.faction).mana = e.data.mana_after;
      v.suppliedDay = e.day;
      spendRerolls([e.data.roll]);
      break;
    case 'np_opened':
      f(e.data.faction).mana = e.data.mana_after;
      // 영창부터 진명을 쓸 수 있도록 즉시 진명까지 공개한다. 바로 뒤의 intel_gained가 같은 단계를 기록한다 (D-137, D-158)
      if (v.battle?.sides.includes(v.player) && e.data.faction !== v.player) v.intel[e.data.faction] = Math.max(v.intel[e.data.faction] ?? 0, INTEL.name);
      break;
    case 'seal_used':
      f(e.data.faction).seals = e.data.seals_left;
      break;
    case 'skill_triggered':
      if (e.data.mana_after !== null) f(e.data.faction).mana = e.data.mana_after;
      break;
    case 'phase_rolled':
      spendRerolls(e.data.rolls);
      if (v.battle) v.battle = { ...v.battle, phaseIndex: e.data.phase_index };
      break;
    case 'escape_attempted':
      spendRerolls(e.data.rolls);
      break;
    case 'intel_gained':
      v.intel[e.data.target] = e.data.level_to;
      if (e.data.roll) spendRerolls([e.data.roll]);
      break;
    case 'bond':
      spendRerolls([e.data.roll]);
      break;
    case 'affinity_changed':
      f(e.data.faction).affinity = e.data.to;
      break;
    case 'eliminated': {
      const x = f(e.data.faction);
      x.alive = false;
      x.out = e.data.cause;
      v.eliminated = [...v.eliminated, { faction: e.data.faction, cause: e.data.cause, by: e.data.by, day: e.day }];
      break;
    }
    case 'battle_started':
      v.battle = { id: e.data.battle_id, sides: e.data.sides, tile: e.data.tile, isFinal: e.data.is_final, phaseIndex: 0 };
      break;
    case 'battle_ended':
      v.battle = null;
      break;
    case 'final_battle_bracket':
      v.final = { round: e.data.round, pairs: e.data.pairs, bye: e.data.bye };
      break;
    case 'run_ended':
      v.ended = { result: e.data.result, winner: e.data.winner };
      break;
  }
  return v;
}

export const viewOf = (events: readonly AnyEvent[]): RunView => events.reduce(applyEvent, emptyView());
