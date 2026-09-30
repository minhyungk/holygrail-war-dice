// 튜닝 수치 (AGENTS.md 규칙 2). data/constants.json을 키별 스키마로 검증해 타입 있는 객체로 내보낸다.
// 코드는 수치를 직접 쓰지 않고 이 객체의 키로만 읽는다. 없는 키를 읽으면 타입 검사에서 걸린다.
import { z } from 'zod';
import raw from '../../data/constants.json';
import rawPhases from '../../data/phases.json';
import rawSkills from '../../data/common/skills.json';
import rawTiles from '../../data/tiles.json';
import { type ActiveSkillDef, ConstantsFile, type ImageGrid, PHASE_IDS, PhasesFile, RANK_LETTERS, REACTIONS, type Reaction, type SkillDef, SkillsFile, TERRAINS, TilesFile, type PhaseDef, type PhaseId, type Tile } from './schema';

const num = z.number();
const int = z.number().int();
const byLetter = <T extends z.ZodType>(t: T) => z.object(Object.fromEntries(RANK_LETTERS.map((l) => [l, t])) as Record<(typeof RANK_LETTERS)[number], T>).strict();
const TERRAIN_PHASES = ['ph_clash', 'ph_initiative', 'ph_sorcery', 'ph_fate'] as const;

const Schema = z
  .object({
    'dice.die_count': int.positive(),
    'dice.die_size': int.positive(),
    'dice.dc': z.object({ easy: num, normal: num, hard: num }).strict(),
    'dice.modifier_gap_cap': num.positive(),
    'dice.miracle_range': byLetter(z.array(int)),
    'dice.miracle_bonus': num,
    'dice.fate_point_init': int,
    'dice.fate_point_min': int,
    'dice.fate_point_max': int,
    'stats.rank_value': byLetter(num),
    'stats.rank_modifier_step': num,
    'stats.special_rank': z.record(z.string(), z.object({ value: num, letter: z.enum(RANK_LETTERS) }).strict()),
    'phase.weights_by_terrain': z
      .object(Object.fromEntries(TERRAINS.map((t) => [t, z.object(Object.fromEntries(TERRAIN_PHASES.map((p) => [p, num.nonnegative()])) as Record<(typeof TERRAIN_PHASES)[number], z.ZodNumber>).strict()])) as Record<(typeof TERRAINS)[number], z.ZodObject<Record<(typeof TERRAIN_PHASES)[number], z.ZodNumber>>>)
      .strict(),
    'phase.fate_dc': num,
    'combat.forecast_samples': int.positive(),
    'combat.forecast_seed': int,
    'combat.phase_count': int.positive(),
    'combat.big_loss_ratio': num.positive(),
    'combat.command_seals': int,
    'combat.night_recovery': int,
    'combat.np_per_battle': int,
    'combat.special_attack_bonus': num,
    'mana.max': num,
    'mana.by_rank': byLetter(z.object({ init: num, regen: num }).strict()),
    'mana.rank_modifier_step': num,
    'mana.np_threshold': num,
    'mana.np_cost': num,
    'mana.supply_result': z.array(z.object({ min: num, result: z.enum(['great', 'success', 'normal', 'fail', 'fumble']), mana: num }).strict()),
    'mana.supply_per_day': int,
    'mana.supply_request_affinity': num,
    'day.days': int.positive(),
    'day.actions_day': int.positive(),
    'day.actions_night': int.positive(),
    'day.move_base': int.positive(),
    'day.riding_move': byLetter(int),
    'day.vision': int.nonnegative(),
    'day.intel_mod': z.array(num).length(4),
    'day.intel_dc': z.array(num).length(4),
    'day.bond_dc': num,
    'day.role_bonus': z.object({ intel: num, bond: num, leyline: num }).strict(),
    'day.ambush_margin': num,
    'day.ambush_bonus': num,
    'affinity.thresholds': z.array(num).length(4),
    'affinity.roll_mod': z.array(num).length(5),
    'affinity.init_by_temperament': z.record(z.string(), num),
    'affinity.gain_mult': z.record(z.string(), num),
    'affinity.penalty_mult': z.record(z.string(), num),
    'affinity.refusal_chance': z.array(num).length(5),
    'affinity.betrayal_chance': z.array(num).length(5),
    'affinity.delta_bond': z.object({ success: num, fail: num }).strict(),
    'affinity.delta_supply': z.object({ great: num, success: num, normal: num, fail: num, fumble: num }).strict(),
    'affinity.delta_post_choice': num,
    'affinity.reaction': z.record(z.string(), z.object(Object.fromEntries(REACTIONS.map((r) => [r, num])) as Record<Reaction, z.ZodNumber>).strict()),
    'ai.accept': z.object({ aggressive: num, proud: num, cautious: num, cunning: num }).strict(),
    'ai.cunning_win_rate': num,
    'ai.elo_d': num,
    'ai.np_open_chance': z.object({ base: num, danger: num }).strict(),
    'ai.retreat_chance': z.object({ aggressive: num, proud: num, cautious: num, cunning: num, cunning_behind: num }).strict(),
    'ai.seal_retreat_max': int.nonnegative(),
    'ai.hunt_from_day': int.positive(),
    'ai.hunt_chance': num.min(0).max(1),
    'skill.rank_amount': z.object({ major: byLetter(num), minor: byLetter(num) }).strict(),
    'skill.fixed_amount': z.record(z.string(), num),
    'skill.rank_mana': byLetter(num),
    'run.extra_class_chance': num.min(0).max(1),
    'text.lines_per_beat_big': int,
    'text.lines_per_beat': int,
    'text.lines_per_beat_small': int,
    'text.max_narration_run': int,
    'text.slot_chance': z.record(z.string(), num.min(0).max(1)),
    'text.death_fx': z.object({ particles: int.positive(), duration_ms: num.positive(), gild_ms: num.nonnegative(), span_px: num.positive(), spread_px: num.positive(), rise_px: num.positive() }).strict().refine((d) => d.gild_ms < d.duration_ms, { message: 'gild_ms < duration_ms' }),
    'text.small_margin': num,
    'text.affinity_magnitude': z.array(num).length(2),
    'text.typing_ms': z.object({ slow: num, normal: num, fast: num }).strict(),
    'text.auto_advance_ms': num,
    'text.fast_forward': num.min(1),
    'text.main_fx': z.object({ silhouette_ms: num.positive(), crossfade_ms: num.nonnegative(), class_light_ms: num.positive(), circle_spin_ms: num.positive(), summon_flash_ms: num.nonnegative() }).strict(),
    'text.trace_fx': z.object({ death_ms: num.positive(), retreat_ms: num.positive(), draw_ms: num.positive() }).strict(),
    'text.line_pause_ms': num,
    'text.vn_keep': int.positive(),
    'text.wish_max_chars': int.positive(),
    'text.wish_grant_ms': num.nonnegative(),
    'text.roll_result_ms': num.nonnegative(),
    'text.pace': z.object({ chant: num, np_name: num, dramatic: num, comma: num, period: num, ellipsis: num, dash: num, bang: num, newline: num }).strict(),
    'text.summon_timing': z.object({ char_ms: num, hold_ms: num, ignite_ms: num, burst_ms: num, line_delay_ms: num }).strict(),
  })
  .strict();
export type Constants = z.infer<typeof Schema>;

export function parseConstants(json: unknown): Constants {
  const file = ConstantsFile.parse(json);
  const keys = file.constants.map((c) => c.key);
  const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (dup.length) throw new Error(`constants 키 중복: ${dup.join(', ')}`);
  return Schema.parse(Object.fromEntries(file.constants.map((c) => [c.key, c.value])));
}

export function parsePhases(json: unknown): Record<PhaseId, PhaseDef> {
  const list = PhasesFile.parse(json).phases;
  const byId = Object.fromEntries(list.map((p) => [p.phase_id, p])) as Record<PhaseId, PhaseDef>;
  const missing = PHASE_IDS.filter((id) => !byId[id]);
  if (missing.length || list.length !== PHASE_IDS.length) throw new Error(`phases.json이 국면 목록과 다르다: 빠짐 ${missing.join(', ')}`);
  return byId;
}

export const K: Constants = parseConstants(raw);
export const PHASES: Record<PhaseId, PhaseDef> = parsePhases(rawPhases);

export function parseTiles(json: unknown): Tile[] {
  const tiles = TilesFile.parse(json).tiles;
  const ids = new Set(tiles.map((t) => t.tile_id));
  for (const t of tiles) for (const a of t.adjacent_ids) if (!ids.has(a)) throw new Error(`${t.tile_id}의 인접 타일 ${a}가 없다`);
  if (tiles.filter((t) => t.tags.includes('center')).length !== 1) throw new Error('중앙 타일은 하나여야 한다');
  return tiles;
}
export const TILES: Tile[] = parseTiles(rawTiles);
export const MAP_GRID: ImageGrid = TilesFile.parse(rawTiles).image_grid;

/** 스킬 효과 정의 (D-142). 고정 효과량 스킬은 skill.fixed_amount에 값이 있어야 한다 */
export function parseSkills(json: unknown): Record<string, SkillDef> {
  const list = SkillsFile.parse(json).skills;
  const byId: Record<string, SkillDef> = {};
  for (const s of list) {
    if (byId[s.skill_id]) throw new Error(`스킬 정의 중복: ${s.skill_id}`);
    if (s.hook !== null && s.scaling === 'fixed' && K['skill.fixed_amount'][s.skill_id] === undefined) throw new Error(`skill.fixed_amount에 ${s.skill_id} 없음`);
    byId[s.skill_id] = s;
  }
  return byId;
}
export const SKILLS: Record<string, SkillDef> = parseSkills(rawSkills);
export const isActiveSkill = (s: SkillDef | undefined): s is ActiveSkillDef => !!s && s.hook !== null;
