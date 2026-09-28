// OWNED BY T8 (전투 — 상태이상) — 스펙 §7.5 CBT-19/20, 플랜 §3 OPEN-12 기본값.
// 순수 상수만 둔다 (import 없음 — data/config 규약). 튜닝은 이 파일의 숫자만 만진다.
//
// 7종: 저주(curse) 공포(fear) 스턴(stun) 스킬봉쇄(skillSeal) 보구봉쇄(npSeal) 출혈(bleed) 현혹(daze)
// stun/skillSeal/npSeal 은 스택이 의미 없는 이진(binary) 상태라 여기 수치가 없다 —
//   스턴      = 행동 자체가 스킵된다 (systems/statuses.ts isActionSkipped)
//   스킬봉쇄  = combatReducer.validateCommand 의 hasStatus 검사로 이미 강제된다
//   보구봉쇄  = 위와 동일 (validateCommand npUnveil case)

/** CBT-20 스택 상한 */
export const MAX_STACKS = 3;

// ── 저주: 스택당 전 판정(공격/방어/거리) −1 + 고정 도트(스택 무관) ──
export const CURSE_ROLL_PENALTY_PER_STACK = -1;
/** 저주 도트는 "3 dmg end of turn" — 스택으로 스케일하지 않는 고정값 */
export const CURSE_DOT_DAMAGE = 3;

// ── 공포: 스택당 공격 판정 −2, ≥2스택이면 "접근" 의도가 "유지"로 강제된다 ──
export const FEAR_ATTACK_PENALTY_PER_STACK = -2;
export const FEAR_FORCE_HOLD_STACKS = 2;

// ── 출혈: 피격/전진 시 고정 피해 (스택 무관 — 터진 상처는 하나) ──
export const BLEED_DAMAGE = 4;

// ── 현혹: 스택당 방어 판정 −3. 관측 대성공은 성공으로 강등("관측 결과 불신") ──
export const DAZE_DEFENSE_PENALTY_PER_STACK = -3;

// ── R1 발생원 수치 (플랜 §3 "R1 발생원") ──
/** 치명타(자연 32) 피격 시 대상이 얻는 출혈 */
export const CRIT_INFLICT_BLEED_STACKS = 1;
export const CRIT_INFLICT_BLEED_TURNS = 2;
/** 캐스터 평타 명중 시 대상이 얻는 저주 */
export const CASTER_HIT_INFLICT_CURSE_STACKS = 1;
export const CASTER_HIT_INFLICT_CURSE_TURNS = 2;
