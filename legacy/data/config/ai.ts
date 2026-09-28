// OWNED BY T10 (통합 — 운영 루프) — 오버월드 AI 정책 상수.
// SOURCE: src/engine/intent.ts INTENT_WEIGHTS / src/engine/config.ts FORCED_HUNT_DAY,
//         src/engine/commandSeal.ts decideAISealUse 임계값. engine 은 frozen 이라 값만 복제한다.
// 전투 **내부** AI 정책은 core/systems/combatAi.ts 소관 — 여기엔 밤/낮 매크로 정책만 둔다.
// 튜닝(T17)은 이 파일의 숫자만 만진다.

import type { ServantClass } from "../types";

/**
 * 이 날짜부터 전 진영이 강제로 "hunt" 의도를 갖는다 (막판 몰아치기).
 * 구 엔진은 7일제의 7일차였다. R1 은 14일제이므로 종반 3일 = 12일차부터로 옮긴다 [DEFAULT].
 */
export const FORCED_HUNT_DAY = 12;

/** 클래스별 [사냥, 경계, 은신] 가중치 (합 100). SOURCE: engine/intent.ts */
export const INTENT_WEIGHTS: Record<ServantClass, [number, number, number]> = {
  Saber: [40, 45, 15],
  Archer: [35, 40, 25],
  Lancer: [50, 35, 15],
  Rider: [45, 30, 25],
  Caster: [20, 35, 45],
  Assassin: [25, 20, 55],
  Berserker: [70, 25, 5],
  Ruler: [30, 50, 20],
  Avenger: [65, 25, 10],
  MoonCancer: [35, 30, 35],
  AlterEgo: [45, 35, 20],
  Foreigner: [40, 20, 40],
  Pretender: [30, 25, 45],
  Shielder: [20, 60, 20],
};

// ─────────────────────────── 영주 (AI 판단) ───────────────────────────
//
// SOURCE: engine/commandSeal.ts decideAISealUse — 승률 임계값만 계승한다.
// R1 에서 AI 가 오버월드에서 영주를 쓰는 곳은 **참수 대응(summonServant)** 뿐이다.
// 전투 내 영주는 combatAi 의 이탈 정책이 대신한다.

/** 이 승률 아래면 AI 는 열세로 본다 (구 AI_SEAL_LOSE_THRESHOLD 0.30 계승) */
export const AI_SEAL_LOSE_WINRATE = 0.3;
/** 이 승률 아래면 도주를 우선한다 */
export const AI_SEAL_ESCAPE_WINRATE = 0.15;
/** 이 승률 위 + 영주 2획 이상이면 보구 전력 개방을 노린다 */
export const AI_SEAL_NP_WINRATE = 0.55;

/**
 * 참수당할 위기의 AI 마스터가 영주(summonServant)로 서번트를 부를 최소 잔여 영주 수.
 * 0 이면 "영주가 있으면 무조건 부른다".
 */
export const AI_BEHEAD_SEAL_MIN = 1;

// ─────────────────────────── 밤 행동 정책 ───────────────────────────

/** 이 마력 이상일 때만 AI 가 마력 공급을 시도한다 */
export const AI_SUPPLY_MIN_MANA = 14;
/** AI 공급 투입량 (SUPPLY_INPUT_MIN~MAX 안에서 클램프된다) */
export const AI_SUPPLY_INPUT = 10;
/** 이 NP 게이지 이상이면 공급을 생략한다 (이미 충분) */
export const AI_SUPPLY_SKIP_NP_GAUGE = 90;
/** 친밀도가 이 값 이상이면 직접(direct) 공급, 아니면 의식(ritual) */
export const AI_SUPPLY_DIRECT_AFFECTION = 65;

/** 사냥 의도 AI 가 목표를 모를 때 무작위 이동할 확률 */
export const AI_WANDER_CHANCE = 0.6;

/** 낮: 마스터가 서번트와 이 홉 이상 떨어지면 합류를 우선한다 */
export const AI_MASTER_REUNITE_DISTANCE = 4;
/** 낮: 마스터가 문헌조사를 시도할 확률 */
export const AI_RESEARCH_CHANCE = 0.75;
