// docs/systems/phases.md §5 예시
import { describe, expect, it } from 'vitest';
import { TERRAINS } from '../data/schema';
import { phaseFromDraw, phaseFromNp, terrainWeightTotal } from './phases';

describe('지형 추첨 (phases.md §3.3)', () => {
  it.each(TERRAINS)('%s: 가중치 합은 100 (추첨값 0~99)', (t) => expect(terrainWeightTotal(t)).toBe(100));
  it('1. 개활지 37 → 정면 격돌', () => expect(phaseFromDraw('open', 37)).toBe('ph_clash'));
  it('2. 시가지 55 → 선제/회피', () => expect(phaseFromDraw('urban', 55)).toBe('ph_initiative'));
  it('경계값: 개활지 49 → 정면, 50 → 선제, 99 → 즉사', () => {
    expect(phaseFromDraw('open', 49)).toBe('ph_clash');
    expect(phaseFromDraw('open', 50)).toBe('ph_initiative');
    expect(phaseFromDraw('open', 99)).toBe('ph_fate');
  });
  it('범위 밖 추첨값은 거부', () => expect(() => phaseFromDraw('open', 100)).toThrow());
});

describe('보구 개방 (phases.md §3.2-2, §3.6)', () => {
  it('3. 한쪽 개방 → 일방 보구, 연 쪽이 공격측', () => {
    expect(phaseFromNp(true, false)).toEqual({ phase: 'ph_np_attack', attacker: 'a' });
    expect(phaseFromNp(false, true)).toEqual({ phase: 'ph_np_attack', attacker: 'b' });
  });
  it('양측 개방 → 보구 격돌, 공격측은 추첨', () => expect(phaseFromNp(true, true)).toEqual({ phase: 'ph_np_clash', attacker: null }));
  it('아무도 열지 않으면 지형 추첨', () => expect(phaseFromNp(false, false)).toBeNull());
});
