// 정보 단계 (docs/systems/day-loop.md §4.3, D-158). 보정 수치는 constants day.intel_mod.
/** 0 없음 → 1 얼굴(얼굴·클래스·스테이터스) → 2 진명 → 3 약점(약점 공략 해금) */
export const INTEL = { none: 0, face: 1, name: 2, weakness: 3 } as const;
export type IntelLevel = (typeof INTEL)[keyof typeof INTEL];
