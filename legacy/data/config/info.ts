// OWNED BY T5 (INFO) — 스펙 §8 밸런스 상수.
// 순수 상수만 둔다 (import 없음). 로직은 src/core/systems/intel.ts, winrateEstimate.ts.
// 튜닝(T17)은 이 파일의 숫자만 만진다.

/** 단서 1개당 판정 보정 (INFO-02) */
export const INFO_BONUS_PER_CLUE = 1;

/** 진명 특정 시 추가 보정 (INFO-03) */
export const TRUE_NAME_BONUS = 2;

/** 정보 보정 총합 상한 — 플레이어 (INFO-04). "정보로 뒤집을 수 있는 최대치" */
export const INFO_BONUS_CAP = 6;

/** AI 정보 보정 상한 (INFO-06) ★주인공 보정 */
export const AI_INFO_CAP = 2;

/**
 * 단서 4축 (INFO-01). 클래스는 초기 무료 획득이라 이 목록·카운트에서 제외한다.
 * 획득 경로: weapon←조우전투/관측스탠스, origin←문헌조사, gender←목격, trait←대성공 탐지
 */
export const CLUE_AXES = ["weapon", "origin", "gender", "trait"] as const;

/** 정보 보정 1점당 표시/추정 승률 이동폭 (비율 단위, 0.03 = 3pp). 튜닝 가능 (INFO-08). */
export const WINRATE_INFO_WEIGHT = 0.03;

/**
 * 승률 구간 표시 반폭(pp), 보유 단서 개수별 (INFO-09).
 * null = "???" (정보 없음). 진명 특정 시엔 이 표를 거치지 않고 정확값을 표시한다.
 */
export const INTERVAL_BY_CLUES: Record<number, number | null> = {
  0: null,
  1: 27,
  2: 7,
  3: 7,
};

/** 구간/정확값 표시 클램프 범위 (percent, 정수) */
export const WINRATE_DISPLAY_MIN = 1;
export const WINRATE_DISPLAY_MAX = 99;

/** INFO-10: 진명 미특정 시 보구 회피 판정 페널티 */
export const NP_EVADE_PENALTY_UNKNOWN = -4;
