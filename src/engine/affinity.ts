// 호감도 (docs/systems/affinity.md).
import { K } from '../data/constants';
import type { ServantProfile } from '../data/schema';
import type { AffinityTier } from './events';

export const AFFINITY_TIERS: readonly AffinityTier[] = ['hostile', 'wary', 'neutral', 'friendly', 'loyal'];
export const AFFINITY_MIN = 0;
export const AFFINITY_MAX = 100;

/** 경계값은 하한 포함, 상한 미포함 (D-054) */
export function tierIndex(value: number): number {
  const t = K['affinity.thresholds'];
  let i = 0;
  while (i < t.length && value >= t[i]!) i++;
  return i;
}
export const tierOf = (value: number): AffinityTier => AFFINITY_TIERS[tierIndex(value)]!;
export const rollMod = (value: number): number => K['affinity.roll_mod'][tierIndex(value)]!;
export const refusalChance = (value: number): number => K['affinity.refusal_chance'][tierIndex(value)]!;
export const betrayalChance = (value: number): number => K['affinity.betrayal_chance'][tierIndex(value)]!;

export function initialAffinity(servant: ServantProfile): number {
  const v = K['affinity.init_by_temperament'][servant.temperament];
  if (v === undefined) throw new Error(`성격별 초기 호감도가 없다: ${servant.temperament}`);
  return v;
}

/** 변동량 = 기본값 × 성격 계수 (상승은 gain, 하락은 penalty). 0~100 절삭 (affinity.md §3.3, §4) */
export function applyDelta(value: number, base: number, servant: ServantProfile): number {
  if (base === 0) return value;
  const mult = (base > 0 ? K['affinity.gain_mult'] : K['affinity.penalty_mult'])[servant.temperament] ?? 1;
  const next = Math.round(value + base * mult);
  return Math.min(AFFINITY_MAX, Math.max(AFFINITY_MIN, next));
}

/** 처치/방면의 기본 변동량 (affinity.md §3.5, D-056, D-079: 선/악이 아니면 중립) */
export function postChoiceDelta(servant: ServantProfile, choice: 'execute' | 'release'): number {
  const d = K['affinity.delta_post_choice'];
  if (servant.alignment === 'good') return choice === 'release' ? d : -d;
  if (servant.alignment === 'evil') return choice === 'release' ? -d : d;
  return 0;
}
