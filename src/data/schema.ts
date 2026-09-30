// 데이터 파일 형식 (docs/04-data-schema.md, docs/systems/narrative-engine.md §5). 순수 TS.
import { z } from 'zod';

export const SERVANT_ID = /^sv_\d{4}_[a-z0-9_]+$/; // D-066
export const MASTER_ID = /^ms_[a-z0-9_]+$/;
export const FACT_NAMESPACES = ['event', 'self', 'enemy', 'world', 'battle', 'beat', 'scene', 'mem', 'pair'] as const;
// narrative-engine.md §7.1
export const PLACEHOLDERS = ['master', 'servant', 'enemy', 'enemy_master', 'place', 'day', 'np', 'actor', 'target', 'winner', 'loser', 'servant_class', 'skill', 'weakness'] as const;
export const JOSA = ['이/가', '은/는', '을/를', '와/과', '으로/로'] as const;

const factKey = z.string().refine((k) => (FACT_NAMESPACES as readonly string[]).includes(k.split('.')[0]!), {
  message: `사실 이름은 ${FACT_NAMESPACES.join('/')}. 네임스페이스로 시작해야 한다`,
});

export const Line = z
  .object({
    id: z.string().regex(/^[a-z0-9_]+$/),
    text: z.string().min(1),
    when: z.record(factKey, z.unknown()).optional(),
    weight: z.number().positive().optional(),
    repeat: z.union([z.literal('always'), z.literal('once_per_run'), z.string().regex(/^cooldown:\d+$/)]).optional(),
    status: z.enum(['draft', 'reviewed']).optional(),
    author: z.enum(['ai', 'user']).optional(),
    source: z.enum(['fgo', 'legacy', 'quote', 'new']).optional(),
    quote_of: z.string().optional(),
    quote_verified: z.boolean().optional(),
    tone: z.enum(['calm', 'defiant', 'playful', 'grim', 'tender', 'cold', 'roar']).optional(),
    slot: z.enum(['lead', 'react', 'tail']).optional(),
    speaker: z.literal('narrator').optional(),
    motif: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })
  .strict();
export type Line = z.infer<typeof Line>;

export const DialogueFile = z
  .object({
    speaker: z.string(),
    scope: z.string().optional(),
    defaults: Line.partial().strict(),
    notes: z.string().optional(),
    tags: z.record(z.string().regex(/^[a-z_]+$/), z.array(Line)),
  })
  .strict();
export type DialogueFile = z.infer<typeof DialogueFile>;

/** 전쟁 연대기 줄글 문장 틀 (D-168, data/common/chronicle.json) */
export const CHRONICLE_PLACEHOLDERS = ['place', 'winner', 'loser', 'dead', 'escaped', 'other', 'a', 'b', 'opener', 'rival', 'master', 'servant', 'n', 'times', 'count', 'list', 'class', 'winner_master'] as const;
export const ChronicleFile = z
  .object({
    scope: z.string(),
    speaker: z.literal('narrator'),
    defaults: Line.partial().strict(),
    notes: z.string().optional(),
    labels: z
      .object({
        day_names: z.array(z.string()).min(7),
        ordinals: z.array(z.string()).min(1),
        counts: z.array(z.string()).min(7),
        heading_night: z.string(),
        heading_day: z.string(),
        heading_range: z.string(),
        heading_final: z.string(),
        ordinal: z.string(),
        ordinal_big: z.string(),
        master_fallback: z.string(),
      })
      .strict(),
    tags: z.object({ battle: z.array(Line), out: z.array(Line), stalemate: z.array(Line), final: z.array(Line), closing: z.array(Line) }).strict(),
  })
  .strict();
export type ChronicleFile = z.infer<typeof ChronicleFile>;

/** 본문의 {자리표시자}{조사} 중 목록에 없는 것을 돌려준다 */
export function unknownPlaceholders(text: string): string[] {
  const bad: string[] = [];
  for (const m of text.matchAll(/\{([^}]+)\}/g)) {
    const name = m[1]!;
    if (!(PLACEHOLDERS as readonly string[]).includes(name) && !(JOSA as readonly string[]).includes(name)) bad.push(name);
  }
  return bad;
}

// ── 판정 엔진 데이터 (docs/04-data-schema.md §5) ──

export const STAT_IDS = ['str', 'end', 'agi', 'mana', 'luck', 'np'] as const; // stats.md §2
export type StatId = (typeof STAT_IDS)[number];
export const RANK_LETTERS = ['E', 'D', 'C', 'B', 'A', 'EX'] as const; // stats.md §3.1
export type RankLetter = (typeof RANK_LETTERS)[number];
/** 정규 7클래스 (한 판에 클래스당 1기) + 엑스트라 클래스 (난입 소환으로만 참전, D-157) */
export const STANDARD_CLASSES = ['saber', 'archer', 'lancer', 'rider', 'caster', 'assassin', 'berserker'] as const;
export const EXTRA_CLASSES = ['ruler', 'avenger', 'alterEgo', 'moonCancer', 'foreigner', 'pretender', 'shielder'] as const;
export const CLASSES = [...STANDARD_CLASSES, ...EXTRA_CLASSES] as const;
export const TERRAINS = ['open', 'urban', 'forest', 'river'] as const; // content/map-fuyuki.md §2
export type Terrain = (typeof TERRAINS)[number];
export const PHASE_IDS = ['ph_clash', 'ph_initiative', 'ph_sorcery', 'ph_fate', 'ph_np_clash', 'ph_np_attack'] as const; // phases.md §2
export type PhaseId = (typeof PHASE_IDS)[number];

/** 호감도 반응을 일으키는 플레이어 선택 (affinity.md §3.6, D-150) */
export const REACTIONS = ['encounter_fight', 'encounter_flee', 'danger_fight', 'danger_seal', 'danger_run', 'np_open', 'weakness'] as const;
export type Reaction = (typeof REACTIONS)[number];

export const ServantProfile = z
  .object({
    servant_id: z.string().regex(SERVANT_ID),
    source_id: z.number().int(),
    name_ko: z.string().min(1),
    /** 한 비트 안에서 두 번째 호칭 (Q-156 ③). 없으면 name_ko 그대로 */
    name_short_ko: z.string().min(1).optional(),
    class: z.enum(CLASSES),
    ranks: z.object(Object.fromEntries(STAT_IDS.map((s) => [s, z.string().min(1)])) as Record<StatId, z.ZodString>).strict(),
    alignment: z.enum(['good', 'neutral', 'evil']).nullable(),
    alignment_detail: z.string(),
    alignment_verified: z.boolean(),
    temperament: z.string(),
    /** 성격 반응표의 서번트별 예외 (D-143 오버라이드, D-150) */
    reaction_overrides: z.object(Object.fromEntries(REACTIONS.map((r) => [r, z.number()])) as Record<Reaction, z.ZodNumber>).partial().strict().optional(),
    /** special_attack: 보구 특공 대상 Atlas 특성 id (D-162) */
    noble_phantasm: z.object({ name_ko: z.string(), ruby_ko: z.string(), rank: z.string(), type_ko: z.string(), special_attack: z.array(z.number().int()) }).strict(),
    /** Atlas 서번트 특성 id (특공 판정, D-162) */
    traits: z.array(z.number().int()),
    /** FGO 보구·스킬에 즉사 효과가 있다: 즉사/우연 국면 발생 조건 (D-163) */
    instant_death: z.boolean(),
    /** detail: Atlas KR 캐릭터 상세 (소환 화면, 범용 약점 문구). weakness: 약점 문구 오버라이드 (D-158, D-165) */
    lore: z.object({ detail: z.string().min(1), weakness: z.string().min(1).optional() }).strict().optional(),
    /** Atlas 이미지 (Q-134): face = 맵 아이콘, summon = 기본 재림 전신, final = 최종 재림 전신 */
    images: z.object({ face: z.string().url(), summon: z.string().url(), final: z.string().url() }).strict(),
    sprite_id: z.string().nullable(),
    notes: z.string().optional(),
  })
  .strict();
export type ServantProfile = z.infer<typeof ServantProfile>;

export const PhaseDef = z
  .object({
    phase_id: z.enum(PHASE_IDS),
    name_ko: z.string().min(1),
    kind: z.enum(['contest', 'solo']),
    attacker_stat: z.array(z.enum(STAT_IDS)),
    defender_stat: z.array(z.enum(STAT_IDS)).min(1),
    selection: z.enum(['terrain', 'np_both', 'np_one']),
    notes: z.string(),
  })
  .strict();
export type PhaseDef = z.infer<typeof PhaseDef>;
export const PhasesFile = z.object({ notes: z.string().optional(), phases: z.array(PhaseDef) }).strict();

export const ConstantEntry = z
  .object({
    key: z.string().regex(/^(dice|combat|phase|affinity|mana|day|ai|skill|text|stats|run)\.[a-z0-9_]+$/),
    value: z.unknown(),
    unit: z.string(),
    doc_ref: z.string(),
    status: z.enum(['확정', '임시값']),
    note: z.string(),
  })
  .strict();
export const ConstantsFile = z.object({ notes: z.string().optional(), constants: z.array(ConstantEntry) }).strict();

export const MasterProfile = z
  .object({
    master_id: z.string().regex(MASTER_ID),
    name_ko: z.string().min(1),
    source_work: z.string(),
    temperament: z.enum(['aggressive', 'proud', 'cautious', 'cunning']),
    stats: z.object({ aptitude: z.null(), mana: z.null() }).strict(), // Q-152 확정 전
    portrait: z.object({ atlas_url: z.string().nullable(), local: z.string().nullable() }).strict(),
    notes: z.string().optional(),
  })
  .strict();
export type MasterProfile = z.infer<typeof MasterProfile>;

export const TILE_ID = /^tl_r\dc\d$/;
export const Tile = z
  .object({
    tile_id: z.string().regex(TILE_ID),
    name_ko: z.string().min(1),
    row: z.number().int(),
    col: z.number().int(),
    terrain: z.enum(TERRAINS),
    /** 낮에 도착·머무르면 자동으로 벌어지는 일 (D-128) */
    role: z.enum(['leyline', 'intel', 'bond']),
    adjacent_ids: z.array(z.string().regex(TILE_ID)),
    tags: z.array(z.string()),
  })
  .strict();
export type Tile = z.infer<typeof Tile>;
/** 지도 이미지 위 격자선 위치(px). 칸 크기가 균일하지 않다 */
export const ImageGrid = z.object({ size: z.number().positive(), cols: z.array(z.number()).length(6), rows: z.array(z.number()).length(6) }).strict();
export type ImageGrid = z.infer<typeof ImageGrid>;
export const TilesFile = z.object({ notes: z.string().optional(), image_grid: ImageGrid, tiles: z.array(Tile) }).strict();

export const SkillLink = z
  .object({ skill_id: z.string().regex(/^sk_[a-z0-9_]+$/), name_ko: z.string(), rank: z.string().nullable(), kind: z.enum(['generic', 'unique', 'noble_phantasm']), origin: z.string() })
  .strict();
export const ServantSkillsFile = z.object({ servant_id: z.string().regex(SERVANT_ID), skills: z.array(SkillLink), notes: z.string().optional() }).strict();
export type ServantSkillsFile = z.infer<typeof ServantSkillsFile>;
export type SkillLink = z.infer<typeof SkillLink>;

// ── 스킬 효과 정의 (skills.md §3~§6, data/common/skills.json, D-142) ──
export const HOOK_IDS = ['hk_battle_phase_select', 'hk_battle_phase_roll', 'hk_battle_escape', 'hk_battle_condition_change'] as const;
const SkillWhenBase = z
  .object({
    phase: z.array(z.enum(['ph_clash', 'ph_initiative', 'ph_sorcery', 'ph_fate', 'ph_np_clash', 'ph_np_attack'])).optional(),
    role: z.enum(['attacker', 'defender']).optional(),
    phase_index: z.number().int().positive().optional(),
    self_condition: z.array(z.enum(['full', 'hurt', 'danger'])).optional(),
    /** 영맥 칸에서 싸우는 중 (D-146, 진지 대체) */
    leyline: z.literal(true).optional(),
    escaper: z.literal(true).optional(),
    foe_dropped: z.literal(true).optional(),
    would_fall: z.literal(true).optional(),
    /** 상대 서번트의 클래스 (D-156: 대마력은 캐스터 상대로) */
    foe_class: z.array(z.string()).min(1).optional(),
    /** 상대 서번트가 이 Atlas 특성 중 하나를 가짐 (스킬 특공, D-162) */
    foe_trait: z.array(z.number().int()).min(1).optional(),
  })
  .strict();
/** any_of: 나머지 조건을 모두 만족하고, 그중 하나 이상의 묶음을 만족하면 발동 (D-156) */
export const SkillWhen = SkillWhenBase.extend({ any_of: z.array(SkillWhenBase).min(2).optional() }).strict();
export const SkillEffect = z.discriminatedUnion('type', [
  z.object({ type: z.literal('roll_mod'), target: z.enum(['self', 'foe']), sign: z.literal(-1).optional() }).strict(),
  z.object({ type: z.literal('event_negate'), target: z.enum(['self', 'foe']), kind: z.enum(['affinity_penalty', 'intel']) }).strict(),
  z.object({ type: z.literal('resource_change'), target: z.literal('self'), resource: z.literal('mana') }).strict(),
  z.object({ type: z.literal('condition_guard'), target: z.literal('self') }).strict(),
]);
export const SkillDef = z.union([
  z.object({ skill_id: z.string().regex(/^sk_[a-z0-9_]+$/), hook: z.null(), notes: z.string() }).strict(),
  z
    .object({
      skill_id: z.string().regex(/^sk_[a-z0-9_]+$/),
      hook: z.enum(HOOK_IDS),
      when: SkillWhen,
      effect: SkillEffect,
      scaling: z.enum(['major', 'minor', 'mana', 'fixed', 'none']),
      uses_per_battle: z.number().int().positive().optional(),
      notes: z.string().optional(),
    })
    .strict(),
]);
export type SkillDef = z.infer<typeof SkillDef>;
export type ActiveSkillDef = Extract<SkillDef, { hook: (typeof HOOK_IDS)[number] }>;
export const SkillsFile = z.object({ notes: z.string().optional(), skills: z.array(SkillDef) }).strict();

// ── 서술 엔진 데이터 ──
export const LabelsFile = z
  .object({
    notes: z.string().optional(),
    class_name: z.record(z.string(), z.string()),
    unknown_servant: z.string(),
    unknown_skill: z.string(),
    player_master: z.string(),
    class_glyph: z.record(z.string(), z.string()),
    class_icon: z.record(z.string(), z.string()),
    grail_image: z.string(),
    image_tokens: z.record(z.string(), z.string()),
  })
  .strict();
export type LabelsFile = z.infer<typeof LabelsFile>;

/** 소환 영창 (S1_SUMMON, D-118) */
export const SummonChantFile = z
  .object({
    notes: z.string().optional(),
    author: z.enum(['ai', 'user']),
    status: z.enum(['draft', 'reviewed']),
    source: z.enum(['fgo', 'legacy', 'quote', 'new']),
    quote_of: z.string().optional(),
    lines: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const SlotDef = z
  .object({
    slot: z.enum(['lead', 'line', 'answer', 'react', 'tail']),
    from: z.enum(['narrator', 'self', 'enemy', 'actor', 'enemy_master']),
    tag: z.string().optional(),
    tag_by: z.object({ fact: z.string(), map: z.record(z.string(), z.string()) }).strict().optional(),
    if: z.record(z.string(), z.unknown()).optional(),
    when_has: z.string().optional(),
    when_lacks: z.string().optional(),
    protected: z.boolean().optional(),
    /** 이 슬롯을 쓸 확률의 이름 (constants text.slot_chance). 짧은 외침이 매 국면 나오지 않게 (D-151) */
    chance: z.string().optional(),
  })
  .strict()
  .refine((s) => !!s.tag !== !!s.tag_by, { message: 'tag와 tag_by 중 하나만' });
export type SlotDef = z.infer<typeof SlotDef>;
export const BeatsFile = z
  .object({
    notes: z.string().optional(),
    beats: z.record(z.string(), z.object({ size: z.enum(['big', 'normal', 'small', 'auto']), style: z.enum(['system']).optional(), slots: z.array(SlotDef) }).strict()),
  })
  .strict();
export type BeatsFile = z.infer<typeof BeatsFile>;
