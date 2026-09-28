// 스탯 랭크 → 수치 (docs/systems/stats.md), 마력량 (docs/systems/mana.md §3.1).
import { K } from '../data/constants';
import { type RankLetter, type ServantProfile, type StatId } from '../data/schema';

export interface ParsedRank {
  /** 판정 보정으로 쓰는 수치 (D-035) */
  value: number;
  /** 랭크 문자. 기적 구간·마력표는 문자 기준 (D-073) */
  letter: RankLetter;
  /** + 개수 - - 개수 */
  modifiers: number;
}

const cache = new Map<string, ParsedRank>();

/** "A+", "B-", "EX", "?", "None" 등 (stats.md §3.1 ~ §3.3) */
export function parseRank(rank: string): ParsedRank {
  const hit = cache.get(rank);
  if (hit) return hit;
  let parsed: ParsedRank;
  const special = K['stats.special_rank'][rank];
  if (special) {
    parsed = { value: special.value, letter: special.letter, modifiers: 0 };
  } else {
    const m = /^(EX|[A-E])([+-]*)$/.exec(rank);
    if (!m) throw new Error(`알 수 없는 랭크 표기: ${rank}`);
    const letter = m[1] as RankLetter;
    const mods = m[2]!;
    if (mods.includes('+') && mods.includes('-')) throw new Error(`알 수 없는 랭크 표기: ${rank}`);
    const modifiers = mods.startsWith('+') ? mods.length : -mods.length;
    parsed = { value: K['stats.rank_value'][letter] + modifiers * K['stats.rank_modifier_step'], letter, modifiers };
  }
  cache.set(rank, parsed);
  return parsed;
}

export const statValue = (servant: ServantProfile, stat: StatId): number => parseRank(servant.ranks[stat]).value;

/** 여러 스탯이면 합산 (D-018) */
export const statSum = (servant: ServantProfile, stats: readonly StatId[]): number => stats.reduce((s, id) => s + statValue(servant, id), 0);

/** 기적이 발동하는 자연값 목록 (dice.md §3.4) */
export const miracleNaturals = (servant: ServantProfile): readonly number[] => K['dice.miracle_range'][parseRank(servant.ranks.luck).letter];

/** 초기 마력과 밤 회복량 (mana.md §3.1, D-080). 최대 마력으로 절삭 */
export function manaByRank(servant: ServantProfile): { init: number; regen: number } {
  const r = parseRank(servant.ranks.mana);
  const base = K['mana.by_rank'][r.letter];
  const d = r.modifiers * K['mana.rank_modifier_step'];
  const max = K['mana.max'];
  return { init: Math.min(max, base.init + d), regen: Math.min(max, base.regen + d) };
}
