// docs/systems/dice.md §7 예시, §4 불변 조건
import { describe, expect, it } from 'vitest';
import { K } from '../data/constants';
import { servant, splitNatural, SV } from '../testkit';
import { canReroll, capModifiers, check, contest } from './dice';
import { miracleNaturals, statSum } from './stats';

const nat = (n: number) => ({ dice: splitNatural(n), natural: n });

describe('예시 (dice.md §7)', () => {
  it('1. 기본 대항: 17.5 vs 16 → 헤라클레스 승, 차이 1.5', () => {
    const h = servant(SV.heracles), m = servant(SV.medea);
    const r = contest(
      { roll: nat(3), modifier: statSum(h, ['str', 'end']), miracle: miracleNaturals(h) },
      { roll: nat(9), modifier: statSum(m, ['str', 'end']), miracle: miracleNaturals(m) },
    );
    expect([r.a.total, r.b.total, r.winner, r.margin]).toEqual([17.5, 16, 'a', 1.5]);
  });
  it('2. 기적: 코지로 21.5 vs 헤라클레스 17 → 차이 4.5', () => {
    const k = servant(SV.kojiro), h = servant(SV.heracles);
    const r = contest(
      { roll: nat(11), modifier: statSum(k, ['agi']), miracle: miracleNaturals(k) },
      { roll: nat(10), modifier: statSum(h, ['agi']), miracle: miracleNaturals(h) },
    );
    expect(r.a.miracle).toBe(true);
    expect(r.b.miracle).toBe(false);
    expect([r.a.total, r.b.total, r.winner, r.margin]).toEqual([21.5, 17, 'a', 4.5]);
  });
  it('3. 차이 상한: 보정 25 vs 5 → 13 vs 5. 기적 +3은 상한 밖', () => {
    expect(capModifiers(25, 5)).toEqual([13, 5]);
    expect(capModifiers(5, 25)).toEqual([5, 13]);
    const r = contest({ roll: nat(12), modifier: 25, miracle: [12] }, { roll: nat(10), modifier: 5, miracle: [12] });
    expect(r.a.applied_modifier).toBe(13);
    expect(r.a.total).toBe(28);
  });
  it('4. 운명점: 3이면 재굴림 가능, 0이면 거부', () => {
    expect(canReroll(3)).toBe(true);
    expect(canReroll(0)).toBe(false);
  });
});

describe('규칙', () => {
  it.each([
    ['easy', [26, 33, 36, 36]],
    ['normal', [10, 21, 30, 33]],
    ['hard', [1, 6, 15, 21]],
  ] as const)('DC 표 §3.2의 %s 성공률: E/C/A/EX', (level, expected) => {
    for (const [i, modifier] of [3, 5, 7, 8].entries()) {
      let successes = 0;
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
        if (check(nat(a + b), modifier, [], K['dice.dc'][level]).success) successes++;
      }
      expect(successes).toBe(expected[i]);
    }
  });
  it.each([['EX', 6], ['A', 3], ['B', 3], ['C', 1], ['D', 1], ['E', 1]] as const)('행운 %s의 기적 빈도는 %d/36', (rank, expected) => {
    let miracles = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
      if (check(nat(a + b), 0, K['dice.miracle_range'][rank], 0).roll.miracle) miracles++;
    }
    expect(miracles).toBe(expected);
  });
  it.each([
    [-2, [0, 3, 12, 11, 10]],
    [0, [3, 7, 16, 7, 3]],
    [2, [10, 11, 12, 3, 0]],
  ] as const)('마력 공급 표 §3.4: 호감도 보정 %d의 결과 빈도', (modifier, expected) => {
    const bands = K['mana.supply_result'];
    const hits = bands.map(() => 0);
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
      const total = check(nat(a + b), modifier, [], Infinity).roll.total;
      hits[bands.findIndex((band) => total >= band.min)]!++;
    }
    expect(hits).toEqual(expected);
  });
  it('양쪽 모두 기적이면 양쪽 모두 +3 (§6)', () => {
    const r = contest({ roll: nat(12), modifier: 5, miracle: [12] }, { roll: nat(12), modifier: 5, miracle: [12] });
    expect([r.a.total, r.b.total, r.winner]).toEqual([20, 20, 'tie']);
  });
  it('단독 판정: 판정값 ≥ DC 이면 성공 (§3.1-3)', () => {
    expect(check(nat(7), 5, [12], 12).success).toBe(true);
    expect(check(nat(6), 5, [12], 12).success).toBe(false);
  });
  it('DC 표 (§3.2): 스탯 C=5, 보통 DC 12 성공률 58.33%', () => {
    let hit = 0, all = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++, all++) if (check(nat(a + b), 5, [], K['dice.dc'].normal).success) hit++;
    expect(hit / all).toBeCloseTo(21 / 36, 8);
  });
});

describe('불변 조건 (§4): 어떤 격차에서도 약자 승률 > 0', () => {
  // 모든 자연값 조합을 전수 계산한다 (기적 제외: 기적은 약자에게만 유리하므로 없는 쪽이 최악)
  const underdogWinRate = (strong: number, weak: number) => {
    let win = 0, all = 0;
    for (let a = 2; a <= 12; a++) for (let b = 2; b <= 12; b++) {
      const w = (x: number) => (x <= 7 ? x - 1 : 13 - x); // 2d6 자연값 경우의 수
      const r = contest({ roll: nat(a), modifier: strong, miracle: [] }, { roll: nat(b), modifier: weak, miracle: [] });
      all += w(a) * w(b);
      if (r.winner === 'b') win += w(a) * w(b);
    }
    return win / all;
  };
  it.each([0, 3, 6, 10, 15, 20, 50])('보정 차이 %d', (gap) => expect(underdogWinRate(5 + gap, 5)).toBeGreaterThan(0));
  it('참고표 (§5): 상한 8에서 약자 승 5/1296', () => expect(underdogWinRate(20, 5)).toBeCloseTo(5 / 1296, 8));
  it('참고표 (§5): 차이 0에서 약자 승 575/1296', () => expect(underdogWinRate(5, 5)).toBeCloseTo(575 / 1296, 8));
});
