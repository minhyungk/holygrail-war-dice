// 스킬 훅 (skills.md §2-6, §3). 스킬은 여기 정의된 시점에만 발동한다. 목록은 data/common/skills.json의 hook과 같다 (D-142).
// 추가·삭제는 skills.md §3, decisions.md 훅 변경 이력과 함께 한다.
export { HOOK_IDS } from '../data/schema';
export type HookId =
  /** 국면 시작, 보구 판단 전 (자원 회복 등) */
  | 'hk_battle_phase_select'
  /** 국면 판정 보정을 정할 때 (양측 굴림 전) */
  | 'hk_battle_phase_roll'
  /** 전투 중 일반 도주 판정 */
  | 'hk_battle_escape'
  /** 국면 결과로 상태가 바뀔 때 (상대 하락 / 내가 쓰러질 때) */
  | 'hk_battle_condition_change';
