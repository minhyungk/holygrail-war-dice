// OWNED BY T6/T7/T8 (전투) — 스펙 §7 CBT 계열 밸런스 상수.
// 순수 상수만 둔다 (**import 없음** — data/config/dice.ts 와 같은 규약).
// core/* 의 타입을 import 하면 data → core 역방향 의존이 생기므로,
// Stance 같은 유니온은 리터럴 키로 다시 적는다 (구조적으로 core/combatTypes.ts 와 호환).
// 튜닝(T17)은 이 파일의 숫자만 만진다.

// ── CBT-01: HP·공격력은 전 서번트 공통 고정값 ──
/** 전 서번트 공통 HP */
export const HP_MAX = 100;
/** 기본 공격 1히트 피해 (킬까지 5~9히트) */
export const ATK_BASE = 18;
/** 대성공(자연 32) 추가 피해 */
export const CRIT_BONUS_DMG = 9;
/** 대항 압도(margin ≥ 10) 추가 피해 */
export const OVERWHELM_BONUS_DMG = 6;

// ── CBT-03: 내구 = 피해 감소 판정 ──
/** 피해 감소 판정 성공 시 경감량 */
export const DMG_REDUCE = 6;
/** 피해 감소 판정 대성공 시 경감량 */
export const DMG_REDUCE_CRIT = 12;
/**
 * 피해 하한 (T7). 감소가 아무리 커도 1은 들어간다 —
 * "0 피해" 는 DICE-07(0% 구조적 금지)의 전투판 위반이라 바닥을 깐다.
 */
export const MIN_DAMAGE = 1;

// ── CBT-07: 보구만이 랭크 비례 배율을 갖는다 ──
/** 보구 기본 피해 */
export const NP_BASE_DMG = 40;
/** 보구 랭크 배율 (± 랭크는 T7의 combatMath 가 보간) */
export const NP_RANK_MULT: Record<"E" | "D" | "C" | "B" | "A" | "EX", number> = {
  E: 0.8,
  D: 0.9,
  C: 1.0,
  B: 1.15,
  A: 1.3,
  EX: 1.5,
};

/**
 * ± 랭크 1단계당 배율 가산 (T7). "A++" → 1.3 + 0.1 = 1.4 (A와 EX 사이 보간).
 * NP_RANK_MULT 표의 letter 배율 위에 얹는다.
 */
export const NP_RANK_PLUS_STEP = 0.05;

/**
 * §7.6 보구 대응 「방어」 — 피해 감소 판정 보정 (INFO-10 으로 진명 특정 시에만 열린다).
 * 성공 시 경감량은 DMG_REDUCE_CRIT 를 쓴다 (보구를 알고 받아내면 평타 대성공급으로 흘린다).
 */
export const NP_GUARD_ROLL_BONUS = 4;

/**
 * NP 게이지 만충치 = 보구 개방 요구량 (MANA-01).
 * NOTE(T4): 게이지 획득량(공격 +8 / 피격 +12 / 턴 재생 등)은 마력 경제라 data/config/mana.ts 소관.
 *           여기엔 "전투가 읽는 임계값"만 둔다.
 */
export const NP_GAUGE_FULL = 100;

// ── DICE-13: 행운 자동 발동 ──
/** 행운 세이브 성공 시 잔존 HP (전투당 1회) */
export const LUCK_SURVIVE_HP = 12;
/**
 * 플레이어의 행운 세이브를 pendingRoll(운명점 재굴림 가능)로 띄울지 여부.
 * resume.ts 에 `case "luckSave":` 배선 완료(오케스트레이터) — 켜져 있다.
 * false 로 내리면 행운 세이브는 인라인(resolveRollNow)으로 해석된다. 수치는 동일하다.
 */
export const LUCK_SAVE_INTERACTIVE = true;

// ── 친밀도 → 판정 보정 (플랜 §6 "MANA-05 친밀도 스탯 보정 → 롤 보정으로 전환") ──
/**
 * SOURCE: src/engine/affection.ts 의 COMBAT_BONUS(승률 ±10%p 테이블) 를
 * d32 롤 보정 스케일(±1.5) 로 재사상한 값. engine 은 frozen 이라 임계값만 복제한다.
 * 티어 임계: hostile<20 / wary<40 / neutral<65 / trusting<80 / intimate<90 / devoted>=90
 *
 * 구 엔진의 "영주 경로에서 친밀도 보너스 누락" 버그는 이 표가
 * combatMath.buildBaseMods 단일 조립 지점에서만 소비되므로 구조적으로 재발할 수 없다.
 */
export const AFFECTION_ROLL_MOD: Record<
  "hostile" | "wary" | "neutral" | "trusting" | "intimate" | "devoted",
  number
> = {
  hostile: -1.5,
  wary: -0.75,
  neutral: 0,
  trusting: 0.5,
  intimate: 1,
  devoted: 1.5,
};

// ── 이탈 후 페널티 (스펙: 도주 후 2일 스탯 페널티) ──
/**
 * 이탈(이탈권 도주 / 영주 도주)한 진영의 FactionState.escapePenaltyDaysLeft 초기값.
 * INTEGRATION(T10): 실제 "스탯 페널티 적용" 은 오버월드 전투 진입부가 소비한다.
 * 전투 도메인은 필드를 세우기만 한다.
 */
export const ESCAPE_PENALTY_DAYS = 2;
/**
 * 이탈 페널티가 살아 있는 동안 **모든 전투 판정**에 얹히는 보정 [T10 DEFAULT].
 * 구 엔진의 ESCAPE_STAT_PENALTY(총점 −20)를 d32 롤 보정 스케일로 눌러 담은 값 —
 * 스탯 1점 ≈ 롤 3점이므로 "총점 −20(≈ 스탯 1점대)" 은 롤 −3 근방이다.
 * 소비 지점은 combatMath.buildBaseMods 단 한 곳, 소멸은 nightEnd 의 일수 틱.
 */
export const ESCAPE_PENALTY_ROLL_MOD = -3;

// ── 관측 스탠스 (§7.4 / INFO) ──
/** 관측 판정 성공 시 획득 단서 수 */
export const OBSERVE_CLUES_SUCCESS = 1;
/** 관측 판정 대성공 시 획득 단서 수 (+ 적 보정 1개 공개) */
export const OBSERVE_CLUES_CRIT = 2;

// ── 턴/종결 ──
/**
 * CBT-17 은 "최대 턴 수 없음"이지만, 헤드리스 AI전(runAutoCombat, T8)과
 * 무한 루프 방어를 위해 하드 캡을 둔다. 도달 시 ended = "turnCap".
 */
export const AUTO_COMBAT_MAX_TURNS = 30;

// ── CBT-08/10: 거리(간합) ──
/** 이탈권 = 거리 4 */
export const DISENGAGE_DISTANCE = 4;
/** 거리 4 를 이만큼 유지한 뒤 이탈 명령이 성립한다 */
export const DISENGAGE_HOLD_TURNS = 1;
/**
 * CBT-09 "민첩 비슷 → 상쇄(순변화 0)" 의 임계 여유차.
 * margin < 이 값 = 근소차 → 양측 의도 상쇄. (압도 임계는 DICE-05 OVERWHELM_MARGIN=10)
 */
export const DISTANCE_NEAR_TIE_MARGIN = 3;

// ── CBT-16: 제안 (OPEN-06 기본값 = 상시 가능, config 게이트) ──
export const PROPOSE_ENABLED = true;
/** R1 스텁: 설득력 스탯이 없으므로 0 (R2에서 마스터 로스터가 채운다) */
export const PROPOSE_PERSUASION_STUB = 0;

// ── 스탠스 (§7.4) ──
/**
 * 공세 +2공/−2방 · 견제 −2공/+2방/거리+2 · 관측 공격 포기.
 * 관측은 "공격 0"이 아니라 **공격 자체를 하지 않는다** → OBSERVE_FORGOES_ATTACK 로 별도 표기.
 */
export const STANCE_MODS: Record<
  "offense" | "harass" | "observe",
  { attack: number; defense: number; distance: number }
> = {
  offense: { attack: 2, defense: -2, distance: 0 },
  harass: { attack: -2, defense: 2, distance: 2 },
  observe: { attack: 0, defense: 2, distance: 0 },
};

/** 관측 스탠스는 딜을 포기하고 단서를 캔다 (단서 채굴 판정은 T5/T8 배선) */
export const OBSERVE_FORGOES_ATTACK = true;

// ── OPEN-03: 태세 붕괴 (정식 채택) ──
/** 태세 붕괴 지속 턴 (무행동) */
export const POSTURE_BREAK_TURNS = 1;
/** 태세 붕괴 중 방어 판정 보정 */
export const POSTURE_BREAK_DEFENSE_PENALTY = -6;

// ── AI 정책 스텁 (T8 combatAi 가 대체) ──
/** 이 HP 아래로 떨어지면 placeholder 정책이 이탈을 시도한다 */
export const AI_FLEE_HP_THRESHOLD = 25;
