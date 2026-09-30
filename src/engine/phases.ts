// 국면 유형 결정 (docs/systems/phases.md §3.2, §3.3).
import { K, PHASES } from '../data/constants';
import type { PhaseDef, PhaseId, Terrain } from '../data/schema';

export const phaseDef = (id: PhaseId): PhaseDef => PHASES[id];

/** 추첨 후보 가중치. 즉사/우연은 즉사 수단이 있는 전투에서만 (phases.md §3.5-0, D-163) */
const drawWeights = (terrain: Terrain, fate: boolean): [PhaseId, number][] =>
  (Object.entries(K['phase.weights_by_terrain'][terrain]) as [PhaseId, number][]).filter(([id]) => fate || id !== 'ph_fate');

/** 지형 가중치 합 (추첨값 범위) */
export const terrainWeightTotal = (terrain: Terrain, fate = true): number => drawWeights(terrain, fate).reduce((s, [, w]) => s + w, 0);

/** 추첨값 r(0 ~ 합-1)을 누적 가중치로 국면에 대응시킨다 (phases.md §5 예시 1·2·7) */
export function phaseFromDraw(terrain: Terrain, r: number, fate = true): PhaseId {
  let acc = 0;
  for (const [id, w] of drawWeights(terrain, fate)) {
    acc += w;
    if (r < acc) return id;
  }
  throw new RangeError(`추첨값 ${r}이 ${terrain} 가중치 합 ${acc} 밖이다`);
}

/**
 * 보구 개방에 따른 국면 (phases.md §3.2-2, §3.6). 개방한 쪽이 없으면 null (지형 추첨으로 간다).
 * 한쪽만 열면 연 쪽이 공격측.
 */
export function phaseFromNp(aOpened: boolean, bOpened: boolean): { phase: PhaseId; attacker: 'a' | 'b' | null } | null {
  if (aOpened && bOpened) return { phase: 'ph_np_clash', attacker: null };
  if (aOpened) return { phase: 'ph_np_attack', attacker: 'a' };
  if (bOpened) return { phase: 'ph_np_attack', attacker: 'b' };
  return null;
}
