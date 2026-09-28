// OWNED BY T9 (DATA) — 클래스 스킬 10종 → 효과 프리미티브 변환 상수 (src/data/skills/classSkills.ts 가 소비).
// data/config 규약: core/* 타입을 import 하지 않는다 (역방향 의존 금지). 순수 상수만 둔다.
// 튜닝(T17)은 이 파일의 숫자만 만진다.
//
// SOURCE: src/engine/config.ts — engine 은 frozen 이라 값만 복제한다(§ "핵심 참조 파일").
// 구 시스템은 "승률 보너스(0~1 비율)"였고, 신 시스템은 "판정 보정(roll_bonus, ±SKILL_MOD_CAP)"
// 이라 값의 성격이 다르다 — 아래 각 상수 옆에 변환 근거를 적어 둔다.

// ── 단독행동 (기존 engine/config.ts INDEPENDENT_ACTION_DAYS 그대로 복제) ──
/** 패배 후 잔존 일수 (랭크별). 판정 보정이 아니라 "일수" 그대로라 변환 불필요. */
export const INDEPENDENT_ACTION_DAYS: Record<string, number> = {
  E: 1,
  D: 1,
  C: 1,
  B: 2,
  A: 3,
  "A+": 3,
  "A++": 3,
  EX: 3,
};

/** 단독행동 잔존 시 스탯 다운 랭크 (구 값 그대로 — T10이 실제 스탯 재계산 시 참조) */
export const INDEPENDENT_ACTION_STAT_PENALTY = 10;

/** 단독현현 추가 잔존 일수 */
export const INDEPENDENT_MANIFESTATION_EXTRA_DAYS = 1;

/** 단독현현 스탯 다운 감소율 */
export const INDEPENDENT_MANIFESTATION_PENALTY_REDUCTION = 0.5;

// ── 광화 (기존 engine/config.ts MAD_DISOBEY_CHANCES 그대로 복제) ──
/** 광화 랭크별 명령 무시 확률. 확률표라 판정 보정으로 변환하지 않는다 — T10의 aiTurn/madEnhancement 대체가 그대로 소비. */
export const MAD_DISOBEY_CHANCES: Record<string, number> = {
  "E-": 0.05,
  E: 0.1,
  "E+": 0.12,
  "D-": 0.12,
  D: 0.15,
  "D+": 0.18,
  "C-": 0.18,
  C: 0.25,
  "C+": 0.28,
  "B-": 0.28,
  B: 0.35,
  "B+": 0.38,
  "A-": 0.38,
  A: 0.45,
  "A+": 0.5,
  "A++": 0.55,
  EX: 0.0,
};

/** 광화 자기 버프 — 근력/내구 +1, 스킬봉쇄 자기부여. 지속은 "전투 내내"를 999턴으로 표현한다(전투 최대 30턴 캡보다 충분히 큼). */
export const MAD_STAT_BUFF_V = 1;
export const MAD_EFFECT_TURNS = 999;

// ── 진지작성 ──
/**
 * 구 TERRITORY_CREATION_BONUS(0.20, 승률 20%p)를 roll_bonus 스케일로 근사 변환한다.
 * DICE-02 스탯보정 스케일(1점 = ±3, 최대격차 15)에서 "20% 승률 우위"에 해당하는 보정폭은
 * 대략 round(0.20 × 15) = 3 — 곧 roll_bonus{all, 3} 값의 근거다.
 */
export const TERRITORY_CREATION_BONUS = 0.2;
export const TERRITORY_ROLL_BONUS_V = Math.round(TERRITORY_CREATION_BONUS * 15);
/** CBT-13 진지 내 NP 재생 배율 */
export const TERRITORY_NP_REGEN_MULT = 1.5;

// ── 도구작성 ──
/** 구 ITEM_CONSTRUCTION_BOOST_RANKS(랜덤 스탯 부스트 랭크 수) — 참고용, R1은 단발 회복 아이템으로 재정의 */
export const ITEM_CONSTRUCTION_BOOST_RANKS = 1;
/** R1: 도구작성 = 1회용 회복 아이템(heal). 값은 CBT-01 고정 HP_MAX(100) 대비 소폭 회복으로 잡는다. */
export const ITEM_CONSTRUCTION_HEAL_V = 15;

// ── 기승 ──
/** 구 RIDING_MOVE_TILES(2칸 이동)의 잔재 — MAP-04 "이동력 = 기본 + 기승 랭크 보정"의 최소 신호. rb(score) ≥ 이 임계일 때만 move_bonus 1 부여. */
export const RIDING_MOVE_BONUS_THRESHOLD_SCORE = 5;
export const RIDING_MOVE_BONUS_V = 1;
/** 구 RIDING_ESCAPE_BONUS(0.15, 도주 성공률 +15%p) — rb() 값을 그대로 이탈(escape) roll_bonus 로 사용한다. */
export const RIDING_ESCAPE_BONUS = 0.15;

// ── 기척차단 ──
/** 구 CONCEALMENT_ESCAPE_BONUS(0.10) — 참고용(현재 conceal 프리미티브 값은 rb() 를 그대로 사용). */
export const CONCEALMENT_ESCAPE_BONUS = 0.1;
/** 랭크 A(score≥7) 이상에서 부여되는 은신 크리티컬 보너스(기습) — crit_up{2, 1turn} */
export const PRESENCE_CONCEALMENT_CRIT_UP_THRESHOLD_SCORE = 7;
export const PRESENCE_CONCEALMENT_CRIT_UP_V = 2;
export const PRESENCE_CONCEALMENT_CRIT_UP_TURNS = 1;

// ── 대마력 / 신성 ──
/** 랭크 A(score≥7) 이상에서 해주 저항(cleanse-resist) 태그가 붙는 임계값 */
export const MAGIC_RESISTANCE_CLEANSE_RESIST_THRESHOLD_SCORE = 7;
