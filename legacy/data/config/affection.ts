// OWNED BY T10 (통합 — 운영 루프) — 친밀도 밤 루프 상수.
// SOURCE: src/engine/affection.ts (ACTION_PREFERENCES / GAIN_MULTIPLIER / PENALTY_MULTIPLIER /
//         REFUSAL_CHANCE) + src/engine/trpgLoop.ts 배신 확률. engine 은 frozen 이라 값만 복제한다.
//
// 전투 판정에 얹히는 친밀도 보정(AFFECTION_ROLL_MOD)은 data/config/combat.ts 소관이다 —
// 여기엔 **오버월드에서 친밀도가 오르내리는 규칙**만 둔다.

import type { Intent } from "../../core/factionTypes";
import type { PersonalityTag } from "../servantPersonality";

export type AffectionTierName =
  | "hostile"
  | "wary"
  | "neutral"
  | "trusting"
  | "intimate"
  | "devoted";

/** 성격별 선호 의도 — 선호하면 +, 기피하면 − (밤마다 1회 정산) */
export const ACTION_PREFERENCES: Record<PersonalityTag, { liked: Intent[]; disliked: Intent[] }> = {
  berserker: { liked: ["hunt"], disliked: ["hide"] },
  avenger: { liked: ["hunt"], disliked: ["hide"] },
  cool: { liked: ["guard"], disliked: ["hide"] },
  saint: { liked: ["guard"], disliked: ["hunt"] },
  assassin: { liked: ["hide"], disliked: ["hunt"] },
  tsundere: { liked: ["hide", "guard"], disliked: ["hunt"] },
  cheerful: { liked: ["hunt", "guard", "hide"], disliked: [] },
  royal: { liked: ["hunt"], disliked: ["hide"] },
};

/** 성격별 하락 배율 — 까다로울수록 불만이 크다 */
export const PENALTY_MULTIPLIER: Record<PersonalityTag, number> = {
  cheerful: 1.0,
  saint: 1.0,
  cool: 1.2,
  tsundere: 1.3,
  assassin: 1.2,
  royal: 1.5,
  berserker: 1.3,
  avenger: 1.5,
};

/** 성격별 상승 배율 — 까다로울수록 기쁨이 적다 */
export const GAIN_MULTIPLIER: Record<PersonalityTag, number> = {
  cheerful: 1.2,
  saint: 1.1,
  cool: 1.0,
  tsundere: 1.2,
  assassin: 1.2,
  royal: 0.8,
  berserker: 0.7,
  avenger: 0.6,
};

/** 선호 의도 정산 기본폭 (+base ~ +base+span-1) */
export const INTENT_LIKED_BASE = 2;
export const INTENT_LIKED_SPAN = 2;
/** 기피 의도 정산 기본폭 (−base ~ −(base+span-1)) */
export const INTENT_DISLIKED_BASE = 3;
export const INTENT_DISLIKED_SPAN = 3;

/** 전투 결과 정산 */
export const BATTLE_WIN_BASE = 3;
export const BATTLE_WIN_SPAN = 3;
/** 열세를 뒤집은 승리 */
export const BATTLE_UPSET_BASE = 5;
export const BATTLE_UPSET_SPAN = 4;
export const BATTLE_ESCAPE_PENALTY = 2;
export const BATTLE_LOSS_BASE = 5;
export const BATTLE_LOSS_SPAN = 4;

/** 조용한 밤 (아무 사건도 없던 밤) */
export const QUIET_NIGHT_DELTA = 1;

/** 영주로 서번트를 강제 제어했을 때의 기본 하락폭 (성격 배율이 곱해진다) */
export const SEAL_FORCE_BASE = 8;
export const SEAL_FORCE_SPAN = 3;
/** 영주 도주 — 목숨을 구해줬다 */
export const SEAL_ESCAPE_DELTA = 2;

/** 명령 거부 확률 (의도 선택 시 1회). SOURCE: engine/affection.ts REFUSAL_CHANCE */
export const REFUSAL_CHANCE: Record<AffectionTierName, number> = {
  hostile: 0.4,
  wary: 0.15,
  neutral: 0,
  trusting: 0,
  intimate: 0,
  devoted: 0,
};

/** 배신 발생 확률 (밤 종료 시 1회). SOURCE: engine/trpgLoop.ts */
export const BETRAYAL_CHANCE: Record<AffectionTierName, number> = {
  hostile: 0.4,
  wary: 0.2,
  neutral: 0,
  trusting: 0,
  intimate: 0,
  devoted: 0,
};
