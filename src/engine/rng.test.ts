import { describe, expect, it } from 'vitest';
import { rollNatural } from './dice';
import { createRng, deriveSeed } from './rng';

describe('rng', () => {
  it('같은 시드는 같은 수열을 낸다', () => {
    const a = createRng(6), b = createRng(6);
    expect(Array.from({ length: 20 }, () => a.next())).toEqual(Array.from({ length: 20 }, () => b.next()));
  });
  it('다른 스트림 시드는 다른 수열을 낸다', () => {
    const a = createRng(deriveSeed(6, 'judge')), b = createRng(deriveSeed(6, 'narrative'));
    expect(a.next()).not.toEqual(b.next());
  });
  it('2d6 자연값은 2~12이고 분포가 삼각형이다 (D-138)', () => {
    const rng = createRng(1);
    const count = new Map<number, number>();
    for (let i = 0; i < 100_000; i++) {
      const r = rollNatural(rng);
      expect(r.natural).toBeGreaterThanOrEqual(2);
      expect(r.natural).toBeLessThanOrEqual(12);
      count.set(r.natural, (count.get(r.natural) ?? 0) + 1);
    }
    // 7이 가장 흔하고(1/6) 12는 드물다(1/36). dice.md §3.4의 기적 확률 근거
    expect(count.get(7)! / 100_000).toBeCloseTo(1 / 6, 2);
    expect(count.get(12)! / 100_000).toBeCloseTo(1 / 36, 2);
  });
  it('가중치 추첨은 가중치 비율을 따른다', () => {
    const rng = createRng(3);
    const hits = [0, 0];
    for (let i = 0; i < 20_000; i++) hits[rng.weighted([1, 3])]!++;
    expect(hits[1]! / 20_000).toBeCloseTo(0.75, 1);
  });
});
