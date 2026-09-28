// docs/systems/dice.md §7 예시, §4 불변 조건
import { describe, expect, it } from 'vitest';
import { K } from '../data/constants';
import { servant, splitNatural, SV } from '../testkit';
import { canReroll, capModifiers, check, contest } from './dice';
import { miracleNaturals, statSum } from './stats';

const nat = (n: number) => ({ dice: splitNatural(n), natural: n });

describe('예시 (dice.md §7)', () => {
  it('1. 기본 대항: 헤라클레스 14.5 + 9 = 23.5 vs 메데이아 7 + 15 = 22 → 헤라클레스 승, 차이 1.5', () => {
    const h = servant(SV.heracles), m = servant(SV.medea);
    const r = contest(
      { roll: nat(9), modifier: statSum(h, ['str', 'end']), miracle: miracleNaturals(h) },
      { roll: nat(15), modifier: statSum(m, ['str', 'end']), miracle: miracleNaturals(m) },
    );
    expect([r.a.total, r.b.total, r.winner, r.margin]).toEqual([23.5, 22, 'a', 1.5]);
  });
  it('2. 기적: 코지로 7.5 + 19 + 5 = 31.5 vs 헤라클레스 7 + 18 = 25 (18은 기적 아님) → 코지로 승, 차이 6.5', () => {
    const k = servant(SV.kojiro), h = servant(SV.heracles);
    const r = contest(
      { roll: nat(19), modifier: statSum(k, ['agi']), miracle: miracleNaturals(k) },
      { roll: nat(18), modifier: statSum(h, ['agi']), miracle: miracleNaturals(h) },
    );
    expect(r.a.miracle).toBe(true);
    expect(r.b.miracle).toBe(false);
    expect([r.a.total, r.b.total, r.winner, r.margin]).toEqual([31.5, 25, 'a', 6.5]);
  });
  it('3. 차이 상한: 보정 25 vs 5 → 강한 쪽을 20으로 절삭. 기적 +5는 상한 밖', () => {
    expect(capModifiers(25, 5)).toEqual([20, 5]);
    expect(capModifiers(5, 25)).toEqual([5, 20]);
    const r = contest({ roll: nat(20), modifier: 25, miracle: [20] }, { roll: nat(10), modifier: 5, miracle: [20] });
    expect(r.a.applied_modifier).toBe(20);
    expect(r.a.total).toBe(20 + 20 + K['dice.miracle_bonus']);
  });
  it('4. 운명점: 3이면 재굴림 가능, 0이면 거부', () => {
    expect(canReroll(3)).toBe(true);
    expect(canReroll(0)).toBe(false);
  });
});

describe('규칙', () => {
  it('양쪽 모두 기적이면 양쪽 모두 +5 (§6)', () => {
    const r = contest({ roll: nat(20), modifier: 5, miracle: [20] }, { roll: nat(20), modifier: 5, miracle: [20] });
    expect([r.a.total, r.b.total, r.winner]).toEqual([30, 30, 'tie']);
  });
  it('단독 판정: 판정값 ≥ DC 이면 성공 (§3.1-3)', () => {
    expect(check(nat(7), 5, [20], 12).success).toBe(true);
    expect(check(nat(6), 5, [20], 12).success).toBe(false);
  });
  it('DC 표 (§3.2): 스탯 C=5, 보통 DC 16 성공률 55%', () => {
    let hit = 0, all = 0;
    for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++, all++) if (check(nat(a + b), 5, [], K['dice.dc'].normal).success) hit++;
    expect(hit / all).toBeCloseTo(0.55, 2);
  });
});

describe('불변 조건 (§4): 어떤 격차에서도 약자 승률 > 0', () => {
  // 모든 자연값 조합을 전수 계산한다 (기적 제외: 기적은 약자에게만 유리하므로 없는 쪽이 최악)
  const underdogWinRate = (strong: number, weak: number) => {
    let win = 0, all = 0;
    for (let a = 2; a <= 20; a++) for (let b = 2; b <= 20; b++) {
      const w = (x: number) => (x <= 11 ? x - 1 : 21 - x); // 2d10 자연값 경우의 수
      const r = contest({ roll: nat(a), modifier: strong, miracle: [] }, { roll: nat(b), modifier: weak, miracle: [] });
      all += w(a) * w(b);
      if (r.winner === 'b') win += w(a) * w(b);
    }
    return win / all;
  };
  it.each([0, 3, 6, 10, 15, 20, 50])('보정 차이 %d', (gap) => expect(underdogWinRate(5 + gap, 5)).toBeGreaterThan(0));
  it('참고표 (§5): 차이 15에서 약자 승 0.15%', () => expect(underdogWinRate(20, 5)).toBeCloseTo(0.0015, 4));
  it('참고표 (§5): 차이 0에서 약자 승 46.7%', () => expect(underdogWinRate(5, 5)).toBeCloseTo(0.4665, 3));
});
