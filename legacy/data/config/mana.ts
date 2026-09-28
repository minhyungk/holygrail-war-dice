// OWNED BY T4 (MANA) — 스펙 §10 MANA 계열 밸런스 상수.
// 순수 상수만 둔다 (import 없음). 로직은 src/core/systems/np.ts, src/core/reducer/manaReducer.ts.
// 튜닝(T17)은 이 파일의 숫자만 만진다.

// ── 마나풀 R1 스텁 (MANA-10 적성 해제 전) ──
/** GameState.factions[].manaMax 초기값과 동일한 스텁. coreConfig.MANA_MAX와 중복되지만
 *  T4는 core/coreConfig.ts를 수정할 수 없으므로 data/config 쪽 밸런스 상수로 별도 보존한다. */
export const MANA_MAX_STUB = 40;
export const MANA_REGEN_BASE = 4;

// ── NP 게이지 경제 (MANA-01) ──
/** 공격 명중 시 NP 획득 */
export const NP_GAIN_ATTACK = 8;
/** 피격 시 NP 획득 */
export const NP_GAIN_HIT_TAKEN = 12;
/** 마력 스탯 점수 1당 턴재생 배율. regen = max(0, (manaScore - NP_REGEN_MANA_FLOOR) * NP_REGEN_PER_MANA_POINT) */
export const NP_REGEN_PER_MANA_POINT = 2;
/** 이 점수 이하는 턴재생 0 (자연 축적 최저 문턱) */
export const NP_REGEN_MANA_FLOOR = 5;
/** 보구 개방에 필요한 NP 게이지 상한 */
export const NP_COST = 100;

// ── 전달 비용 3축 (MANA-02) ──
export const TRANSFER_EFF: Record<"same" | "adjacent" | "far", number> = {
  same: 1.0,
  adjacent: 0.7,
  far: 0.4,
};
/** 15↑ 대량 전달 = 마력 흐름 감지 → 마스터 위치 노출 */
export const TRANSFER_EXPOSE_THRESHOLD = 15;
/** 25↑ = 각인 부담 → 다음 밤 행동력(AP) −1 */
export const TRANSFER_STRAIN_THRESHOLD = 25;

// ── 공급 3방식 (MANA-04) ──
export const SUPPLY_AP: Record<"ritual" | "direct" | "attune", number> = {
  ritual: 1,
  direct: 1,
  attune: 2,
};
export const SUPPLY_INPUT_MIN = 5;
export const SUPPLY_INPUT_MAX = 25;

// ── 판정 (MANA-07) ──
/** 관계보정: 최상(devoted/intimate) +8 / 호의(trusting) +3 / 중립 0 / 불화(wary) −5 / 최악(hostile) −10 */
export const RELATION_MOD: Record<
  "devoted" | "intimate" | "trusting" | "neutral" | "wary" | "hostile",
  number
> = {
  devoted: 8,
  intimate: 8,
  trusting: 3,
  neutral: 0,
  wary: -5,
  hostile: -10,
};
/** 방식보정 — 의식/직접은 0, 동조는 대화·식사 등 정성적 교감으로 +4 */
export const METHOD_MOD: Record<"ritual" | "direct" | "attune", number> = {
  ritual: 0,
  direct: 0,
  attune: 4,
};
/** 투입량 페널티 나눗수 — penalty = -round(input / INPUT_PENALTY_DIVISOR) */
export const INPUT_PENALTY_DIVISOR = 5;
/**
 * 마스터 적성 보정. DICE-02 statBonus(score) = (score-5.5)×3 스케일을
 * MasterAptitude 6등급(E~EX, ±수식어 없음)에 그대로 적용한 값.
 */
export const APTITUDE_MOD: Record<"EX" | "A" | "B" | "C" | "D" | "E", number> = {
  EX: 7.5,
  A: 4.5,
  B: 1.5,
  C: -1.5,
  D: -4.5,
  E: -7.5,
};

// ── 결과 부작용 ──
/** 대실패(회로 역류) 마스터 HP 손상 */
export const CIRCUIT_BACKLASH_HP = 8;
/** 대성공 — 다음 전투 1회 한정 스탯 버프 */
export const SUPPLY_CRIT_BUFF = 3;
/** 동조 공급 사용 시 그날 밤 피탐지 보정 */
export const ATTUNE_VULNERABLE_DETECT_BONUS = 4;
