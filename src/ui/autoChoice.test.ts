// combat.md §4.3 빨리감기 자동 선택 예시 (D-166)
import { describe, expect, it } from 'vitest';
import type { RunPrompt } from '../engine/run';
import { ffAutoAnswer } from './autoChoice';

const phase = (options: ('np' | 'seal_np' | 'weakness')[]): RunPrompt => ({ kind: 'phase_command', faction: 'fc_p', phase_index: 1, options, enemy_np: false, mana: 80, seals: 3, weakness_phase: 'ph_clash' });

describe('빨리감기 자동 선택 (D-166)', () => {
  it('보구를 열 수 있으면 연다 (약점 공략보다 먼저)', () => expect(ffAutoAnswer(phase(['np', 'seal_np', 'weakness']))).toBe('np'));
  it('보구가 없으면 약점 공략', () => expect(ffAutoAnswer(phase(['seal_np', 'weakness']))).toBe('weakness'));
  it('영주 보구 즉시 발동은 쓰지 않는다', () => expect(ffAutoAnswer(phase(['seal_np']))).toBe('none'));
  it('운명점 재굴림은 쓰지 않는다', () =>
    expect(ffAutoAnswer({ kind: 'reroll', faction: 'fc_p', context: 'phase', own: {} as never, opponent_total: 10, opponent_roll: null, dc: null, fate_points: 3 })).toBe(false));
  it('위험 진입은 멈추고 묻는다', () => expect(ffAutoAnswer({ kind: 'danger_decision', faction: 'fc_p', options: ['fight', 'seal', 'run'], seals: 3 })).toBeUndefined());
});
