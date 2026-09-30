// docs/systems/stats.md §5, content/servants-5th.md §2·§3, mana.md §3.1
import { describe, expect, it } from 'vitest';
import { servant, SV } from '../testkit';
import { manaByRank, miracleNaturals, parseRank, statSum, statTotal, statValue, underdogOf } from './stats';

describe('랭크 → 수치 (stats.md §3)', () => {
  it.each([
    ['E', 3], ['D', 4], ['C', 5], ['B', 6], ['A', 7], ['EX', 8],
    ['A+', 7.5], ['A++', 8], ['B-', 5.5], ['?', 7], ['None', 5], ['A?', 7],
  ])('%s → %d', (rank, v) => expect(parseRank(rank).value).toBe(v));
  it('A++ 와 EX는 수치가 같지만 문자가 다르다 (§4)', () => {
    expect(parseRank('A++').letter).toBe('A');
    expect(parseRank('EX').letter).toBe('EX');
  });
  it('모르는 표기는 거부한다', () => {
    expect(() => parseRank('Z')).toThrow();
    expect(() => parseRank('A+-')).toThrow();
  });
});

describe('예시 (stats.md §5)', () => {
  it('1. 헤라클레스 근력 A+ 7.5, 내구 A 7 → 정면 격돌 14.5', () => {
    const h = servant(SV.heracles);
    expect(statValue(h, 'str')).toBe(7.5);
    expect(statValue(h, 'end')).toBe(7);
    expect(statSum(h, ['str', 'end'])).toBe(14.5);
  });
  it('2. 메데이아 근력 E 3, 내구 D 4 → 정면 격돌 7', () => expect(statSum(servant(SV.medea), ['str', 'end'])).toBe(7));
  it('3. 에미야 보구 ? → 7, 코지로 보구 None → 5', () => {
    expect(statValue(servant(SV.emiya), 'np')).toBe(7);
    expect(statValue(servant(SV.kojiro), 'np')).toBe(5);
  });
});

describe('시작 7기 표 (servants-5th.md §2·§3)', () => {
  // 정면 격돌, 6스탯 합, 기적 구간
  it.each([
    [SV.artoria, 12, 40.5, [11, 12]],
    [SV.cu, 11, 32, [12]],
    [SV.emiya, 9, 30, [12]],
    [SV.medusa, 10, 33.5, [12]],
    [SV.medea, 7, 30.5, [11, 12]],
    [SV.kojiro, 8, 30.5, [11, 12]],
    [SV.heracles, 14.5, 41.5, [11, 12]],
  ] as const)('%s', (id, clash, total, miracle) => {
    const s = servant(id);
    expect(statSum(s, ['str', 'end'])).toBe(clash);
    expect(statSum(s, ['str', 'end', 'agi', 'mana', 'luck', 'np'])).toBe(total);
    expect(miracleNaturals(s)).toEqual(miracle);
  });
});

describe('마력량 (mana.md §3.1, D-080)', () => {
  it.each([
    [SV.artoria, 80, 40],
    [SV.cu, 40, 30],
    [SV.emiya, 60, 35],
    [SV.medusa, 60, 35],
    [SV.medea, 85, 45],
    [SV.kojiro, 10, 20],
    [SV.heracles, 80, 40],
  ] as const)('%s: 초기 %d / 회복 %d', (id, init, regen) => expect(manaByRank(servant(id))).toEqual({ init, regen }));
});

describe('기적 약자 (dice.md §3.4, D-166)', () => {
  it('스탯 합이 낮은 쪽이 약자, 같으면 없음', () => {
    const k = servant(SV.kojiro);
    const h = servant(SV.heracles);
    expect(statTotal(k)).toBeLessThan(statTotal(h));
    expect(underdogOf(k, h)).toBe('a');
    expect(underdogOf(h, k)).toBe('b');
    expect(underdogOf(h, h)).toBeNull();
  });
});
