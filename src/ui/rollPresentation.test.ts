import { describe, expect, it } from 'vitest';
import type { RollBreakdown } from '../engine/combat';
import { EventLog } from '../engine/events';
import { servant, SV } from '../testkit';
import { escapePresentation, statLines, wasShown } from './rollPresentation';
import { T } from './strings';

describe('판정 표시 (D-137)', () => {
  it('미공개 스탯은 개별 랭크·수치·합산 중간값을 표시 데이터에 포함하지 않는다', () => {
    const unknown = statLines(servant(SV.heracles), ['str', 'end'], false);
    expect(unknown).toEqual([{ label: T.hiddenStats, value: null }]);
    expect(statLines(servant(SV.heracles), ['str', 'end'], true)).toEqual([
      { label: '근력 A+', value: 7.5 }, { label: '내구 A', value: 7 },
    ]);
  });

  it.each(['encounter', 'battle'] as const)('%s 도주: 플레이어/적 도주 성공·실패를 플레이어 시점으로 표시', (context) => {
    for (const success of [true, false]) {
      for (const faction of ['fc_p', 'fc_e']) {
        const log = new EventLog();
        log.emit('escape_attempted', [faction], { faction, success, context, battle_id: context === 'battle' ? 'bt_1' : null, rolls: [] });
        const shown = escapePresentation(log.ofType('escape_attempted')[0]!, 'fc_p');
        expect(shown).toEqual(faction === 'fc_p'
          ? { title: T.flee, ok: success, result: success ? T.sys.escapeOk : T.sys.escapeFail }
          : { title: T.chase, ok: !success, result: success ? T.sys.enemyEscaped : T.sys.enemyEscapeFail });
      }
    }
  });

  it('재굴림 거절 뒤 같은 굴림만 재사용하고 같은 눈의 새 판정은 다시 보여 준다', () => {
    const shown: RollBreakdown = { faction: 'fc_p', dice: [3, 4], natural: 7, modifier: 5, applied_modifier: 5, total: 12, miracle: false, stats: ['agi'], parts: {} };
    expect(wasShown(shown, { ...shown })).toBe(true);
    expect(wasShown(shown, { ...shown, dice: [3, 4] })).toBe(false);
    expect(wasShown(shown, { ...shown, faction: 'fc_e' })).toBe(false);
    expect(wasShown(shown, undefined)).toBe(false);
    expect(wasShown(null, shown)).toBe(false);
  });
});
