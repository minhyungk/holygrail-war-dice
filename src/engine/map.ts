// 후유키 5×5 맵: 인접, 이동 범위, 시야 (docs/systems/day-loop.md §5, content/map-fuyuki.md).
import { K, TILES } from '../data/constants';
import type { ServantSkillsFile, Tile } from '../data/schema';
import { parseRank } from './stats';

const byId = new Map(TILES.map((t) => [t.tile_id, t]));
export const tile = (id: string): Tile => {
  const t = byId.get(id);
  if (!t) throw new Error(`없는 타일: ${id}`);
  return t;
};
export const allTileIds = (): string[] => TILES.map((t) => t.tile_id);
export const centerTileId = (): string => TILES.find((t) => t.tags.includes('center'))!.tile_id;
export const neighbors = (id: string): string[] => tile(id).adjacent_ids;

/** 상하좌우 이동 거리 (인접 = 상하좌우, D-073) */
export const distance = (a: string, b: string): number => {
  const ta = tile(a), tb = tile(b);
  return Math.abs(ta.row - tb.row) + Math.abs(ta.col - tb.col);
};

/** from에서 steps칸 이내로 갈 수 있는 타일 (자기 자리 제외) → 최단 경로 */
export function reachable(from: string, steps: number): Map<string, string[]> {
  const paths = new Map<string, string[]>([[from, []]]);
  let frontier = [from];
  for (let s = 0; s < steps; s++) {
    const next: string[] = [];
    for (const id of frontier)
      for (const n of neighbors(id)) {
        if (paths.has(n)) continue;
        paths.set(n, [...paths.get(id)!, n]);
        next.push(n);
      }
    frontier = next;
  }
  paths.delete(from);
  return paths;
}

/** 한 행동의 최대 이동 칸 수: 기본 1, 기승 랭크별 (day-loop.md §5, D-073) */
export function moveRange(skills: ServantSkillsFile | null): number {
  const riding = skills?.skills.find((s) => s.skill_id === 'sk_riding');
  const base = K['day.move_base'];
  if (!riding?.rank) return base;
  return Math.max(base, K['day.riding_move'][parseRank(riding.rank).letter]);
}

/** 기본 시야: 상하좌우 거리 day.vision 이내 (천리안·은신은 스킬 작업에서) */
export const visible = (from: string, to: string): boolean => distance(from, to) <= K['day.vision'];
