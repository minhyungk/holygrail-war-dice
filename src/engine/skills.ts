// 스킬 발동 판단 (skills.md, D-142). 전투가 훅 시점마다 부른다. 조건이 맞으면 자동 발동한다 (D-042).
// 효과 정의는 data/common/skills.json, 효과량은 constants의 skill.* 키.
import { isActiveSkill, K, SKILLS } from '../data/constants';
import type { ActiveSkillDef, PhaseId, SkillLink } from '../data/schema';
import type { Condition } from './events';
import type { HookId } from './hooks';
import { parseRank } from './stats';

export interface ActiveSkill {
  skill_id: string;
  rank: string | null;
  def: ActiveSkillDef;
}

/** 훅에서 판단할 사실. 해당 없는 값은 비운다 */
export interface SkillCtx {
  phase?: PhaseId;
  role?: 'attacker' | 'defender';
  phaseIndex: number;
  selfCondition: Condition;
  /** 영맥 칸에서 싸우는 중 (D-146) */
  leyline: boolean;
  escaper?: boolean;
  foeDropped?: boolean;
  wouldFall?: boolean;
}

/** 보유 스킬 중 그 훅에 붙은 것 (보유 목록 순서) */
export function skillsAt(links: readonly SkillLink[], hook: HookId): ActiveSkill[] {
  const out: ActiveSkill[] = [];
  for (const l of links) {
    const def = SKILLS[l.skill_id];
    if (isActiveSkill(def) && def.hook === hook) out.push({ skill_id: l.skill_id, rank: l.rank, def });
  }
  return out;
}

export function whenOk(w: ActiveSkillDef['when'], c: SkillCtx): boolean {
  if (w.phase && (!c.phase || !w.phase.includes(c.phase))) return false;
  if (w.role && w.role !== c.role) return false;
  if (w.phase_index !== undefined && w.phase_index !== c.phaseIndex) return false;
  if (w.self_condition && !w.self_condition.includes(c.selfCondition)) return false;
  if (w.leyline && !c.leyline) return false;
  if (w.escaper && !c.escaper) return false;
  if (w.foe_dropped && !c.foeDropped) return false;
  if (w.would_fall && !c.wouldFall) return false;
  return true;
}

/** 효과량: 랭크 문자 기준 (+/- 무시) 또는 고정값. 크기가 없는 효과(무효·버팀)는 0 */
export function skillAmount(s: ActiveSkill): number {
  switch (s.def.scaling) {
    case 'major':
    case 'minor':
      return s.rank ? K['skill.rank_amount'][s.def.scaling][parseRank(s.rank).letter] : 0;
    case 'fixed':
      return K['skill.fixed_amount'][s.skill_id] ?? 0;
    case 'none':
      return 0;
  }
}
