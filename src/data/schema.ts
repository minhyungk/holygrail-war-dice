// 데이터 파일 형식 (docs/04-data-schema.md, docs/systems/narrative-engine.md §5). 순수 TS.
import { z } from 'zod';

export const SERVANT_ID = /^sv_\d{4}_[a-z0-9_]+$/; // D-066
export const MASTER_ID = /^ms_[a-z0-9_]+$/;
export const FACT_NAMESPACES = ['event', 'self', 'enemy', 'world', 'battle', 'beat', 'scene', 'mem', 'pair'] as const;
// narrative-engine.md §7.1
export const PLACEHOLDERS = ['master', 'servant', 'enemy', 'enemy_master', 'place', 'day', 'np', 'actor', 'target', 'winner', 'loser', 'servant_class'] as const;
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

/** 본문의 {자리표시자}{조사} 중 목록에 없는 것을 돌려준다 */
export function unknownPlaceholders(text: string): string[] {
  const bad: string[] = [];
  for (const m of text.matchAll(/\{([^}]+)\}/g)) {
    const name = m[1]!;
    if (!(PLACEHOLDERS as readonly string[]).includes(name) && !(JOSA as readonly string[]).includes(name)) bad.push(name);
  }
  return bad;
}
