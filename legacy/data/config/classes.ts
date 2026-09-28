// OWNED BY T6/T7/T8 (전투) — 스펙 §7.3 CBT-11/12/13 클래스별 최적 간합.
//
// | 클래스 | 최적 | 밖에서는 |
// | 세이버 | 0~1 | 2↑ 위력 50%, 3↑ 공격 불가 |
// | 아처   | 2~3 | 0~1 위력 40% |
// | 랜서   | 1~2 | 0에서도 준수 (창의 이점) |
// | 라이더 | 가변 | 민첩 우위로 거리 강제 |
// | 캐스터 | 2~4 | 근접 시 거의 무력 |
// | 어새신 | 0   | (투척 무기로 최소한의 견제) |
// | 버서커 | 0~1 | 스탯 폭등, 선택권 상실 |
//
// data/config 규약: core/* 타입을 import 하지 않는다 (역방향 의존 금지).
// 거리 키는 0|1|2|3|4 리터럴 — core/combatTypes.ts 의 Distance 와 구조적으로 호환된다.

import type { ServantClass } from "../types";

/** 간합 이탈 시 페널티 1건 */
export interface RangePenalty {
  /** 피해 배율 (1 미만 = 감쇄). T7 combatMath 가 소비 */
  dmgMult?: number;
  /** 명중/공격 판정 보정 */
  rollMod?: number;
  /** 이 거리에서는 공격 자체가 불가 */
  blocked?: boolean;
}

export interface ClassRangeProfile {
  /** [최소, 최대] — 이 구간 안에서는 무보정 */
  optimal: [number, number];
  /** 최적 밖 거리별 페널티. 명시되지 않은 거리는 무보정 */
  penalties: Partial<Record<0 | 1 | 2 | 3 | 4, RangePenalty>>;
  /**
   * CBT-11 라이더: "민첩 우위로 거리 강제" — 거리 대항 판정 전용 보정.
   * (스킬 캡 대상이 아니라 클래스 정체성이므로 kind "situation" 으로 들어간다)
   */
  distanceContestBonus?: number;
}

// ─────────────────────────── 7 기본 클래스 원형 ───────────────────────────

const SABER: ClassRangeProfile = {
  optimal: [0, 1],
  penalties: {
    2: { dmgMult: 0.5 },
    3: { blocked: true },
    4: { blocked: true },
  },
};

const ARCHER: ClassRangeProfile = {
  optimal: [2, 3],
  penalties: {
    0: { dmgMult: 0.4 },
    1: { dmgMult: 0.4 },
    // 이탈권까지 벌어지면 조준이 흔들린다 (공격 자체는 가능 — 원거리형의 정체성)
    4: { rollMod: -2 },
  },
};

const LANCER: ClassRangeProfile = {
  optimal: [1, 2],
  // "0에서도 준수" — 접적당해도 창 자루로 받아친다 (경미한 판정 보정만)
  penalties: {
    0: { rollMod: -1 },
    3: { dmgMult: 0.5 },
    4: { blocked: true },
  },
};

const RIDER: ClassRangeProfile = {
  optimal: [1, 2],
  penalties: {
    0: { dmgMult: 0.7 },
    3: { dmgMult: 0.6 },
    4: { blocked: true },
  },
  // 기동 = 거리 지배. 거리 대항에서만 +2
  distanceContestBonus: 2,
};

const CASTER: ClassRangeProfile = {
  optimal: [2, 4],
  penalties: {
    0: { dmgMult: 0.3, rollMod: -4 },
    1: { dmgMult: 0.3, rollMod: -4 },
  },
  // INTEGRATION(T9 DATA / T3 MAP): CBT-13 「진지 작성」 보완은 이 표가 아니라
  // 자기 진지 필드 안에서의 **효과 프리미티브(roll_bonus/stat_buff)** 로 들어온다.
  // 즉 근접 페널티는 그대로 두고, 진지 보너스가 위에 얹혀 상쇄되는 구조다.
};

const ASSASSIN: ClassRangeProfile = {
  optimal: [0, 0],
  penalties: {
    1: { dmgMult: 0.7 },
    // 투척 무기 폴백 — 완전 무력화 대신 최소한의 견제만 남긴다
    2: { dmgMult: 0.4 },
    3: { blocked: true },
    4: { blocked: true },
  },
};

const BERSERKER: ClassRangeProfile = {
  optimal: [0, 1],
  penalties: {
    2: { dmgMult: 0.6 },
    3: { blocked: true },
    4: { blocked: true },
  },
};

// ─────────────────── CBT-12: 엑스트라 클래스 = 최근접 원형 매핑 ───────────────────

/** 원형 프로필의 얕은 복제 (참조 공유 방지 — 튜닝 시 한쪽만 만지다 사고나는 걸 막는다) */
function derive(base: ClassRangeProfile, patch?: Partial<ClassRangeProfile>): ClassRangeProfile {
  return {
    optimal: [base.optimal[0], base.optimal[1]],
    penalties: { ...base.penalties },
    ...(base.distanceContestBonus !== undefined
      ? { distanceContestBonus: base.distanceContestBonus }
      : {}),
    ...patch,
  };
}

/**
 * CBT-11/12 — src/data/types.ts 의 ServantClass 14종 **전부**를 덮는다.
 * (Record 이므로 클래스가 추가되면 이 표가 컴파일 에러로 알려준다)
 */
export const CLASS_RANGE: Record<ServantClass, ClassRangeProfile> = {
  Saber: SABER,
  Archer: ARCHER,
  Lancer: LANCER,
  Rider: RIDER,
  Caster: CASTER,
  Assassin: ASSASSIN,
  Berserker: BERSERKER,

  // 엑스트라 — 최근접 원형
  Ruler: derive(SABER),
  // NOTE(T7): 실더는 방어 편향(피해 감소 보정)이 정체성이지만 그건 간합표가 아니라
  //           combatMath 의 방어 보정 소관이다. 간합만 보면 세이버 원형.
  Shielder: derive(SABER),
  Avenger: derive(BERSERKER),
  AlterEgo: derive(LANCER),
  MoonCancer: derive(CASTER),
  Foreigner: derive(CASTER),
  Pretender: derive(ASSASSIN),
};

// ─────────────────────────── 조회 헬퍼 ───────────────────────────

/** 해당 거리의 페널티 (없으면 무보정) */
export function rangePenaltyAt(profile: ClassRangeProfile, distance: number): RangePenalty {
  const penalty = profile.penalties[distance as 0 | 1 | 2 | 3 | 4];
  return penalty ?? {};
}

/** 이 거리에서 공격이 가능한가 (CBT-11 "3↑ 공격 불가") */
export function canAttackAt(profile: ClassRangeProfile, distance: number): boolean {
  return rangePenaltyAt(profile, distance).blocked !== true;
}

/** 최적 간합 안인가 */
export function isOptimalRange(profile: ClassRangeProfile, distance: number): boolean {
  return distance >= profile.optimal[0] && distance <= profile.optimal[1];
}
