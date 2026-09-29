import type { ServantProfile } from '../data/schema';
import type { RollBreakdown } from '../engine/combat';
import type { GameEvent } from '../engine/events';
import { parseRank } from '../engine/stats';
import { T } from './strings';

/** 未公開の個別ス탯은 합산 중간값에도 쓰지 않는다 (D-137). */
export function statLines(servant: ServantProfile, stats: readonly string[], known: boolean): { label: string; value: number | null }[] {
  if (!known) return [{ label: T.hiddenStats, value: null }];
  return stats.map((id) => {
    const rank = servant.ranks[id as keyof typeof servant.ranks];
    return { label: `${T.stat[id]} ${rank}`, value: parseRank(rank).value };
  });
}

/** 같은 눈이 나온 다음 굴림과 구분한다. 엔진은 한 굴림의 dice 배열을 프롬프트·이벤트에서 공유한다. */
export function wasShown(shown: RollBreakdown | null, roll: Pick<RollBreakdown, 'dice' | 'faction'> | undefined): boolean {
  return !!shown && !!roll && shown.faction === roll.faction && shown.dice === roll.dice;
}

/** 도주하는 쪽과 플레이어 시점을 구분한다. 판정 결과 자체는 엔진의 success를 쓴다. */
export function escapePresentation(e: GameEvent<'escape_attempted'>, player: string) {
  const runner = e.data.faction === player;
  return {
    title: runner ? T.flee : T.chase,
    ok: runner ? e.data.success : !e.data.success,
    result: runner
      ? e.data.success ? T.sys.escapeOk : T.sys.escapeFail
      : e.data.success ? T.sys.enemyEscaped : T.sys.enemyEscapeFail,
  };
}
