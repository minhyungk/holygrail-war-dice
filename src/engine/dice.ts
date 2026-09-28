// 주사위와 판정 (docs/systems/dice.md). 무작위는 rng.ts만 거친다.
import { K } from '../data/constants';
import type { Rng } from './rng';

export interface NaturalRoll {
  dice: number[];
  natural: number;
}

/** 판정용 주사위 (dice.die_count d dice.die_size) */
export function rollNatural(rng: Rng): NaturalRoll {
  const dice = Array.from({ length: K['dice.die_count'] }, () => rng.int(1, K['dice.die_size']));
  return { dice, natural: dice.reduce((s, d) => s + d, 0) };
}

/** 한쪽의 확정된 판정 (굴림 + 보정) */
export interface RollResult {
  natural: number;
  dice: number[];
  /** 상한 적용 전 보정 합 */
  modifier: number;
  /** 대항 판정의 차이 상한 적용 후 보정 (단독 판정은 modifier와 같다) */
  applied_modifier: number;
  miracle: boolean;
  total: number;
}

export function isMiracle(natural: number, miracleNaturals: readonly number[]): boolean {
  return miracleNaturals.includes(natural);
}

/**
 * 대항 판정의 보정 차이 상한 (dice.md §3.3, §7 예시 3): 강한 쪽 보정을 깎아 차이를 cap으로 맞춘다.
 * 기적 보정은 이 상한 밖에서 더한다.
 */
export function capModifiers(a: number, b: number): [number, number] {
  const cap = K['dice.modifier_gap_cap'];
  if (a - b > cap) return [b + cap, b];
  if (b - a > cap) return [a, a + cap];
  return [a, b];
}

export function resolveRoll(roll: NaturalRoll, modifier: number, appliedModifier: number, miracleNaturals: readonly number[]): RollResult {
  const miracle = isMiracle(roll.natural, miracleNaturals);
  return {
    natural: roll.natural,
    dice: roll.dice,
    modifier,
    applied_modifier: appliedModifier,
    miracle,
    total: roll.natural + appliedModifier + (miracle ? K['dice.miracle_bonus'] : 0),
  };
}

export type ContestOutcome = 'a' | 'b' | 'tie';

/** 대항 판정 (dice.md §3.1-2). 판정값이 큰 쪽이 이긴다 */
export function contest(
  a: { roll: NaturalRoll; modifier: number; miracle: readonly number[] },
  b: { roll: NaturalRoll; modifier: number; miracle: readonly number[] },
): { a: RollResult; b: RollResult; winner: ContestOutcome; margin: number } {
  const [ma, mb] = capModifiers(a.modifier, b.modifier);
  const ra = resolveRoll(a.roll, a.modifier, ma, a.miracle);
  const rb = resolveRoll(b.roll, b.modifier, mb, b.miracle);
  const winner = ra.total > rb.total ? 'a' : rb.total > ra.total ? 'b' : 'tie';
  return { a: ra, b: rb, winner, margin: Math.abs(ra.total - rb.total) };
}

/** 단독 판정 (dice.md §3.1-3): 판정값 ≥ DC 이면 성공 */
export function check(roll: NaturalRoll, modifier: number, miracle: readonly number[], dc: number): { roll: RollResult; success: boolean } {
  const r = resolveRoll(roll, modifier, modifier, miracle);
  return { roll: r, success: r.total >= dc };
}

/** 운명점 재굴림 가능 여부 (dice.md §3.5, §6) */
export function canReroll(fatePoints: number): boolean {
  return fatePoints > 0;
}
