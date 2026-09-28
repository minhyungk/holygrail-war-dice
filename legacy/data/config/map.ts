// OWNED BY T3 (MAP) — 스펙 §9 밸런스 상수.
// 숫자만 둔다. 로직은 src/core/systems/{movement,vision}.ts.
// 튜닝(T17)은 이 파일의 숫자만 만진다.

import type { MapActionKind, SlotKind } from "../../core/mapTypes";
import type { ServantClass } from "../types";

// ─────────────────────────────── AP (MAP-11) ───────────────────────────────

/** 세그먼트(낮=마스터 / 밤=서번트)당 행동력 */
export const AP_PER_SEGMENT = 3;

/**
 * 행동별 AP 소모표.
 * - move            구역 간 이동 1 (구역 **내부** 노드 이동은 0 — moveCost 참조)
 * - moveCrossRiver  도하 이동 **총** 2 (교량 구역 → 반대편 구역 1회 이동)
 * - supply          마력 공급 기본값. 실제 1~2 분기는 MANA 태스크(공급 방식별)가 소유
 */
export const AP_COSTS: Record<MapActionKind, number> = {
  move: 1,
  moveCrossRiver: 2,
  scout: 1,
  supply: 1,
  ambush: 2,
  territory: 2,
  occupyLeyline: 2,
  workshopFortify: 2,
  research: 1,
};

/** 구역 내부 노드 이동은 무료 (2계층 맵의 핵심 — 이동 피로 방지) */
export const INTRA_DISTRICT_MOVE_COST = 0;

/**
 * 기승 랭크 C 이상(점수 5)이면 세그먼트당 첫 구역이동 1회 무료 (MAP-04).
 * 점수 체계는 data/types.ts statRankToScore (E=3 … EX=8).
 */
export const RIDING_FREE_MOVE_MIN_SCORE = 5;

// ─────────────────────────────── 시야 (MAP-05/06) ───────────────────────────────

/** 기본 시야 (노드 BFS 거리) */
export const VISION_BASE = 2;

/** 클래스별 시야 (OPEN-05 기본값: 아처 4 / 어새신·캐스터 3) */
export const VISION_BY_CLASS: Partial<Record<ServantClass, number>> = {
  Archer: 4,
  Assassin: 3,
  Caster: 3,
};

/** 이 거리 이내는 은폐와 무관하게 **무조건 상호 발견** (MAP-06 "최소한의 저항선") */
export const AUTO_DETECT_RANGE = 2;

/** 시야 상한 방어값 — 어떤 보너스 조합에서도 이 이상은 보지 못한다 */
export const VISION_MAX = 6;

/** 자동 발견 범위를 넘어선 1홉당 관측측이 받는 불이익 */
export const VISION_DISTANCE_PENALTY = 2;

// ─────────────────────────────── 영맥 ───────────────────────────────

/** 점거한 영맥 1등급당 세그먼트 마력 재생 보너스 */
export const LEYLINE_REGEN = 2;

/** 영맥 점거 시 노출 보정 (점거는 눈에 띈다) */
export const LEYLINE_OCCUPY_EXPOSURE = 2;

// ─────────────────────────────── 미개방 슬롯 (MAP-03) ───────────────────────────────

export interface SlotPoolEntry {
  kind: SlotKind;
  /** 가중치 (합계는 임의) */
  weight: number;
  /** SlotContent.magnitude 로 그대로 들어간다 */
  magnitude: number;
}

/**
 * 슬롯 내용물 추첨 풀. 게임 초기화 시 슬롯 노드마다 1회씩 뽑는다.
 * 함정이 가장 흔하고 촉매 유물이 가장 귀하다.
 */
export const SLOT_POOL: SlotPoolEntry[] = [
  { kind: "leylineBoost", weight: 3, magnitude: 1 },
  { kind: "workshopClue", weight: 3, magnitude: 1 },
  { kind: "trap", weight: 3, magnitude: 6 },
  { kind: "neutralMage", weight: 2, magnitude: 1 },
  { kind: "catalystRelic", weight: 1, magnitude: 1 },
];

/** 함정 슬롯이 추가로 깎는 마력 */
export const SLOT_TRAP_MANA_DAMAGE = 5;

// ─────────────────────────── 거리 티어 (MANA-02 전달 효율) ───────────────────────────

/** districtDistanceTier() → 마력 전달 효율. MANA 태스크가 소비한다. */
export const MANA_TRANSFER_EFFICIENCY: Record<"same" | "adjacent" | "far", number> = {
  same: 1.0,
  adjacent: 0.7,
  far: 0.4,
};
