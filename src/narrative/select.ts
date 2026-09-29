// 대사 선택 규칙 (narrative-engine.md §6, D-104).
import type { Rng } from '../engine/rng';
import type { Line } from '../data/schema';

export type Facts = Record<string, unknown>;

/** 조건 하나: 값이 같거나, 연산자 객체({gte}, {lt}, {in}, {not}) (§5.3) */
export function matches(cond: unknown, value: unknown): boolean {
  if (cond !== null && typeof cond === 'object' && !Array.isArray(cond)) {
    const c = cond as Record<string, unknown>;
    if ('in' in c) return Array.isArray(c.in) && c.in.includes(value);
    if ('gte' in c) return typeof value === 'number' && value >= (c.gte as number);
    if ('gt' in c) return typeof value === 'number' && value > (c.gt as number);
    if ('lte' in c) return typeof value === 'number' && value <= (c.lte as number);
    if ('lt' in c) return typeof value === 'number' && value < (c.lt as number);
    if ('not' in c) return value !== c.not;
    return false;
  }
  return value === cond;
}

export const whenOk = (when: Record<string, unknown> | undefined, facts: Facts): boolean =>
  Object.entries(when ?? {}).every(([k, c]) => matches(c, facts[k]));

/** 후보 대사 (계층 정보 포함) */
export interface Candidate {
  line: Line;
  /** tx_{화자}_{태그}_{id} */
  textId: string;
  /** 0 = 서번트, 1 = 클래스, 2 = 공통 (§6.1) */
  layer: number;
  speaker: string;
}

export interface Memory {
  /** textId → 마지막으로 쓴 비트 번호 */
  said: Map<string, number>;
  beat: number;
  /** 풀(태그·화자)별 직전 대사 */
  lastInPool: Map<string, string>;
}

function repeatOk(c: Candidate, mem: Memory): boolean {
  const r = c.line.repeat ?? 'always';
  const last = mem.said.get(c.textId);
  if (last === undefined || r === 'always') return true;
  if (r === 'once_per_run') return false;
  const n = Number(r.split(':')[1]);
  return mem.beat - last > n;
}

/**
 * §6: 조건을 전부 만족하고 반복 규칙을 통과한 후보 → 가장 구체적인 계층(서번트 > 클래스 > 공통, D-144) →
 * 그 안에서 점수(조건 수) 최고 → 직전 대사 제외 → 가중치 추첨. 후보가 없으면 null.
 */
export function pick(cands: readonly Candidate[], facts: Facts, mem: Memory, rng: Rng, poolKey: string): Candidate | null {
  const ok = cands.filter((c) => !c.line.text.includes('[[PLACEHOLDER') && whenOk(c.line.when, facts) && repeatOk(c, mem));
  if (!ok.length) return null;
  const layer = Math.min(...ok.map((c) => c.layer));
  const inLayer = ok.filter((c) => c.layer === layer);
  const score = (c: Candidate) => Object.keys(c.line.when ?? {}).length;
  const top = Math.max(...inLayer.map(score));
  let best = inLayer.filter((c) => score(c) === top);
  const last = mem.lastInPool.get(poolKey);
  if (best.length > 1 && last) best = best.filter((c) => c.textId !== last);
  const chosen = best[rng.weighted(best.map((c) => c.line.weight ?? 1))]!;
  mem.said.set(chosen.textId, mem.beat);
  mem.lastInPool.set(poolKey, chosen.textId);
  return chosen;
}
