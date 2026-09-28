// OWNED BY T2 (DICE 엔진) — 스펙 §6 밸런스 상수.
// 순수 상수만 둔다 (import 없음). 로직은 src/core/dice.ts.
// 튜닝(T17)은 이 파일의 숫자만 만진다.

/** 주사위 면 수. 판정은 언제나 d32 (DICE-01) */
export const DIE = 32;

// ── 고정 DC (DICE-03, d32 기댓값 16.5 기준) ──
export const DC_EASY = 16;
export const DC_STANDARD = 22;
export const DC_HARD = 28;

// ── 0% 금지 장치 (DICE-07) ──
/** 스킬 보정 개별 상한 ±6 */
export const SKILL_MOD_CAP = 6;
/** 동시 적용 스킬 보정 합계 상한 ±9 */
export const SKILL_MOD_SUM_CAP = 9;
/** 대항 판정 보정 총합 격차 상한 — 열세측 최소 승률 2.7% 보장 */
export const TOTAL_GAP_CAP = 24;

/** 대항 여유차 10 이상 = "압도" 연출 분기 (DICE-05) */
export const OVERWHELM_MARGIN = 10;

// ── 스탯보정 = (스탯 점수 − 5.5) × 3 (DICE-02) ──
/** 스탯 점수 중앙값 (E=3 ~ EX=8) */
export const STAT_BONUS_CENTER = 5.5;
/** 스탯 점수 1당 보정폭 */
export const STAT_BONUS_SCALE = 3;

// ── 행운 자동 발동 (DICE-13) ──
/** 치명·즉사급 피해 상황 보정 */
export const LUCK_SAVE_SITUATION = -5;
/** 행운 세이브 DC */
export const LUCK_SAVE_DC = DC_STANDARD;
