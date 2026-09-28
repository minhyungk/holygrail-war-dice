// OWNED BY T9 (DATA) — 스펙 §14.4 R1 "서번트별 스킬 없이 클래스 스킬만 반영" / 플랜 §8.
// 클래스 스킬 10종(대마력/기승/기척차단/진지작성/도구작성/단독행동/광화/신성/기척감지/단독현현)
// → 효과 프리미티브 테이블. 탐지(접두사 매칭)는 기존 skillKeys.ts 방식을 그대로 쓴다
// (core/systems/classSkillFx.ts findClassSkillRank 가 실행 시점에 랭크 점수를 뽑아 여기 넘긴다).
//
// activeSkills.ts(정규식 13룰, engine)는 이번 R1에서 은퇴한다 — 개인 스킬 변환은 R2 몫.
// specialAttack 20기는 core/systems/classSkillFx.ts.specialAttackRollBonus() 로 대체됐다.
//
// data/skills 규약(data/config 와 다름): core/effects/types.ts 의 EffectPrimitive 를
// import 한다 — 이 테이블 자체가 "core가 소비할 데이터"이기 때문이다(config/* 처럼 core를
// 참조하지 않는 순수 상수 파일이 아니다). core → data 방향의 역참조는 없다(순환 없음).

import type { EffectPrimitive } from "../../core/effects/types";
import {
  CONCEALMENT_ESCAPE_BONUS,
  ITEM_CONSTRUCTION_HEAL_V,
  MAD_EFFECT_TURNS,
  MAD_STAT_BUFF_V,
  MAGIC_RESISTANCE_CLEANSE_RESIST_THRESHOLD_SCORE,
  PRESENCE_CONCEALMENT_CRIT_UP_THRESHOLD_SCORE,
  PRESENCE_CONCEALMENT_CRIT_UP_TURNS,
  PRESENCE_CONCEALMENT_CRIT_UP_V,
  RIDING_ESCAPE_BONUS,
  RIDING_MOVE_BONUS_THRESHOLD_SCORE,
  RIDING_MOVE_BONUS_V,
  TERRITORY_NP_REGEN_MULT,
  TERRITORY_ROLL_BONUS_V,
} from "../config/skills";

/** 클래스 스킬 10종 식별자 — src/i18n/skillKeys.ts SKILL_PREFIXES 와 필드명이 1:1 대응한다. */
export type ClassSkillId =
  | "presenceConcealment"
  | "magicResistance"
  | "itemConstruction"
  | "territoryCreation"
  | "riding"
  | "independentAction"
  | "independentManifestation"
  | "presenceDetection"
  | "madEnhancement"
  | "divinity";

/**
 * DICE-02 스탯 점수(E=3~EX=8, ±0.5)를 판정 보정 스케일로 눌러 담는다.
 * rb(3)=0→clamp 1, rb(8)=5. 이론상 상한 6까지 클램프하지만 statRankToScore의 실제
 * 최댓값(8)에서는 5가 최대치 — 6은 미래 스탯 확장(예: "EX+")에 대비한 안전 상한이다.
 * DICE-07 SKILL_MOD_CAP(±6)과 정확히 일치시켜, 이 값이 그대로 roll_bonus.v 에 들어가도
 * validate.ts 의 스킬캡 검사를 절대 넘지 않도록 설계했다.
 */
export function rb(score: number): number {
  return Math.max(1, Math.min(6, Math.round(score - 3)));
}

/** 클래스 스킬 → 효과 프리미티브. 랭크 점수(rankScore) 하나만 받는다 — 태그/발동조건은 CLASS_SKILL_TAGS. */
export const CLASS_SKILL_EFFECTS: Record<ClassSkillId, (rankScore: number) => EffectPrimitive[]> = {
  // 대마력 → 마술 방어 판정 보정
  magicResistance: (score) => [{ t: "roll_bonus", v: rb(score), scope: "magicDefense" }],

  // 기승 → 이동력(MAP-04) + 거리 대항 보정 + 이탈(CBT-10) 보정
  riding: (score) => {
    const effects: EffectPrimitive[] = [];
    if (score >= RIDING_MOVE_BONUS_THRESHOLD_SCORE) {
      effects.push({ t: "move_bonus", v: RIDING_MOVE_BONUS_V });
    }
    effects.push({ t: "roll_bonus", v: Math.ceil(rb(score) / 2), scope: "distance" });
    // RIDING_ESCAPE_BONUS(구 0.15 승률 가산)의 정신을 이어 이탈 판정에 rb() 전체를 싣는다
    // (기승이 "필드에서 강해지는" 정체성의 핵심이 이탈이라 절반이 아닌 전체를 배정).
    void RIDING_ESCAPE_BONUS; // 문서화용 참조 — 실제 스케일은 rb() 로 대체됐다.
    effects.push({ t: "roll_bonus", v: rb(score), scope: "escape" });
    return effects;
  },

  // 기척차단 → 은폐 대항 보정 + (A 이상) 기습 크리티컬 보너스
  presenceConcealment: (score) => {
    const effects: EffectPrimitive[] = [{ t: "conceal", v: rb(score) }];
    void CONCEALMENT_ESCAPE_BONUS; // 문서화용 — 은신 성공 시 이탈 이점은 conceal 값이 대신한다.
    if (score >= PRESENCE_CONCEALMENT_CRIT_UP_THRESHOLD_SCORE) {
      effects.push({
        t: "crit_up",
        v: PRESENCE_CONCEALMENT_CRIT_UP_V,
        turns: PRESENCE_CONCEALMENT_CRIT_UP_TURNS,
      });
    }
    return effects;
  },

  // 진지작성 → NP 재생 배율 + 자기 필드 전 판정 보정(활성 조건은 T10이 게이트 — tags "territory" 참조)
  territoryCreation: () => [
    { t: "np_regen_mult", v: TERRITORY_NP_REGEN_MULT },
    { t: "roll_bonus", v: TERRITORY_ROLL_BONUS_V, scope: "all" },
  ],

  // 도구작성 → 1회용 회복 아이템(의미론: tags "item"/"oneUse" — 소모 처리는 T10)
  itemConstruction: () => [{ t: "heal", v: ITEM_CONSTRUCTION_HEAL_V }],

  // 단독행동 → 전투 판정 효과 없음. 생존 일수는 config/skills.ts INDEPENDENT_ACTION_DAYS(랭크 문자열 키)로 별도 조회.
  independentAction: () => [],

  // 광화 → 자기 스탯 버프 + 자기 스킬봉쇄(항명 확률표는 config/skills.ts MAD_DISOBEY_CHANCES)
  madEnhancement: () => [
    { t: "stat_buff", stat: "strength", v: MAD_STAT_BUFF_V, turns: MAD_EFFECT_TURNS },
    { t: "stat_buff", stat: "endurance", v: MAD_STAT_BUFF_V, turns: MAD_EFFECT_TURNS },
    { t: "state_apply", id: "skillSeal", stacks: 1, turns: MAD_EFFECT_TURNS },
  ],

  // 신성 → 마술 방어 절반 보정(대마력보다 약함) + 해주 저항 성향(tags "curseResist")
  divinity: (score) => [{ t: "roll_bonus", v: Math.ceil(rb(score) / 2), scope: "magicDefense" }],

  // 기척감지 → 시야 + 발견 대항 보정
  presenceDetection: (score) => [
    { t: "vision_bonus", v: 1 },
    { t: "roll_bonus", v: rb(score), scope: "detect" },
  ],

  // 단독현현 → 단독행동과 동일(전투 효과 없음). 추가 생존일수/페널티 완화는 config 테이블 별도 조회.
  independentManifestation: () => [],
};

/**
 * 클래스 스킬별 태그(DATA-09 태그 단위 밸런스 리뷰 + 발동조건/의미론 마커).
 * SkillDef.tags 는 최소 1개가 필수(validate.ts)라, 랭크 조건부 마커(예: 대마력 A+ 이상의
 * "cleanseResist")도 여기서 점수를 받아 조건부로 얹는다.
 */
export const CLASS_SKILL_TAGS: Record<ClassSkillId, (rankScore: number) => string[]> = {
  magicResistance: (score) =>
    score >= MAGIC_RESISTANCE_CLEANSE_RESIST_THRESHOLD_SCORE
      ? ["magicDefense", "cleanseResist"]
      : ["magicDefense"],
  riding: () => ["mobility", "escape"],
  presenceConcealment: () => ["stealth", "escape"],
  territoryCreation: () => ["territory", "field", "np_gen"],
  itemConstruction: () => ["item", "oneUse", "heal"],
  independentAction: () => ["survival"],
  madEnhancement: () => ["disobey", "selfBuff", "transform"],
  divinity: () => ["curseResist", "magicDefense"],
  presenceDetection: () => ["vision", "detect"],
  independentManifestation: () => ["survival", "extended"],
};

/** ClassSkillId 전체 순회용 (탐지 스윕/테스트가 공유) */
export const CLASS_SKILL_IDS: ClassSkillId[] = [
  "presenceConcealment",
  "magicResistance",
  "itemConstruction",
  "territoryCreation",
  "riding",
  "independentAction",
  "independentManifestation",
  "presenceDetection",
  "madEnhancement",
  "divinity",
];
