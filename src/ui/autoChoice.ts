// 전투 빨리감기 중 자동 선택 (combat.md §4.3, D-161 → D-166).
import type { RunAnswer, RunPrompt } from '../engine/run';

/**
 * 빨리감기 중 플레이어 대신 고를 답. undefined면 멈추고 플레이어에게 묻는다.
 * - 국면 지시: 보구를 열 수 있으면 연다, 아니면 약점 공략, 둘 다 없으면 지시 안 함. 영주(영주 보구 즉시 발동)는 쓰지 않는다
 * - 운명점 재굴림: 쓰지 않는다
 * - 위험 진입(계속 싸움 / 영주 퇴각 / 일반 도주)과 그 밖의 선택: 멈춘다
 */
export function ffAutoAnswer(p: RunPrompt): RunAnswer | undefined {
  switch (p.kind) {
    case 'phase_command':
      return p.options.includes('np') ? 'np' : p.options.includes('weakness') ? 'weakness' : 'none';
    case 'reroll':
      return false;
    default:
      return undefined;
  }
}
