// 전쟁 연대기 (D-166): 끝난 전쟁의 이벤트 기록에서 날짜·시간대별 주요 사건을 뽑는다. 판정은 하지 않고 기록을 읽기만 한다.
// 전쟁이 끝난 뒤 보여 주므로 진명을 모두 공개한다 (D-156 전쟁 결산과 같다).
import { TILES } from '../data/constants';
import type { AnyEvent, GameEvent, TimeOfDay } from '../engine/events';

export type ChronicleKind = 'battle' | 'choice' | 'out' | 'final';

export interface ChronicleItem {
  kind: ChronicleKind;
  /** 사건에 등장하는 진영 (얼굴·이름 표시용) */
  factions: string[];
  /** 전투: 장소 이름 */
  place?: string;
  /** 전투 결과. win이면 winner/loser, 소멸이면 dead */
  result?: 'win' | 'draw' | 'escape' | 'escape_failed';
  winner?: string | null;
  loser?: string | null;
  dead?: string | null;
  escaped?: string | null;
  /** 플레이어가 치른 전투인가 */
  mine?: boolean;
  /** 처치/방면 */
  choice?: 'execute' | 'release';
  /** 탈락 원인·상대 */
  cause?: string;
  by?: string | null;
  /** 전투: 이 전투에서 보구를 연 진영 */
  np?: string[];
}

export interface ChronicleSection {
  day: number;
  time: TimeOfDay;
  items: ChronicleItem[];
}

const tileName = (id: string | null | undefined) => (id ? (TILES.find((t) => t.tile_id === id)?.name_ko ?? id) : undefined);

export function buildChronicle(events: readonly AnyEvent[], player: string): ChronicleSection[] {
  const sections: ChronicleSection[] = [];
  const started = new Map<string, GameEvent<'battle_started'>>();
  const opened = new Map<string, string[]>();
  const push = (e: AnyEvent, item: ChronicleItem) => {
    const last = sections.at(-1);
    if (last && last.day === e.day && last.time === e.time) last.items.push(item);
    else sections.push({ day: e.day, time: e.time, items: [item] });
  };
  for (const e of events) {
    switch (e.type) {
      case 'battle_started':
        started.set(e.data.battle_id, e as GameEvent<'battle_started'>);
        break;
      case 'final_started':
        push(e, { kind: 'final', factions: [...e.data.factions], place: tileName(e.data.tile) });
        break;
      case 'np_opened':
        opened.set(e.data.battle_id, [...(opened.get(e.data.battle_id) ?? []), e.data.faction]);
        break;
      case 'battle_ended': {
        // 플레이어 전투와 적끼리 전투 모두. 탈락(eliminated)은 이 뒤에 기록된다
        const s = started.get(e.data.battle_id);
        if (!s) break;
        push(e, { kind: 'battle', mine: s.data.sides.includes(player), factions: [...s.data.sides], place: tileName(s.data.tile), result: e.data.result, winner: e.data.winner, loser: e.data.loser, dead: e.data.dead, escaped: e.data.escaped, np: opened.get(e.data.battle_id) ?? [] });
        break;
      }
      case 'post_choice':
        push(e, { kind: 'choice', factions: [e.data.faction, e.data.target], choice: e.data.choice });
        break;
      case 'eliminated':
        push(e, { kind: 'out', factions: [e.data.faction], cause: e.data.cause, by: e.data.by });
        break;
    }
  }
  return sections;
}
