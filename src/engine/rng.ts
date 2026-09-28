// 시드 고정 RNG. 게임의 모든 무작위는 이 모듈만 거친다 (AGENTS.md 규칙 5, dice.md §3.7).
// 같은 시드 + 같은 호출 순서 = 같은 결과.

export interface Rng {
  /** [0, 1) 실수 */
  next(): number;
  /** min 이상 max 이하 정수 */
  int(min: number, max: number): number;
  /** 가중치 추첨. weights 길이만큼의 인덱스 중 하나 */
  weighted(weights: readonly number[]): number;
}

/** mulberry32. 프로토타입(prototype/mockup)과 같은 알고리즘 */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(min, max) {
      if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) throw new RangeError(`bad range ${min}..${max}`);
      return min + Math.floor(next() * (max - min + 1));
    },
    weighted(weights) {
      const total = weights.reduce((s, w) => s + w, 0);
      if (!(total > 0)) throw new RangeError('weights must sum to > 0');
      let r = next() * total;
      for (let i = 0; i < weights.length; i++) {
        r -= weights[i]!;
        if (r < 0) return i;
      }
      return weights.length - 1;
    },
  };
}

/** 이름 붙은 스트림용 시드. 판정용과 서술용 RNG를 분리할 때 쓴다 (narrative-engine.md §2) */
export function deriveSeed(seed: number, stream: string): number {
  let h = 2166136261 ^ (seed >>> 0);
  for (let i = 0; i < stream.length; i++) h = Math.imul(h ^ stream.charCodeAt(i), 16777619);
  return h >>> 0;
}
