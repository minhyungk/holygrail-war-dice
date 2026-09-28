import { describe, expect, it } from 'vitest';
import { parseRuby, visibleLength } from './Ruby';

describe('루비 (D-117)', () => {
  it('따옴표 보구명', () =>
    expect(parseRuby('받아라, ‘약속된 승리의 검(엑스칼리버)’!')).toEqual([{ base: '받아라, ' }, { base: '‘' }, { base: '약속된 승리의 검', rt: '엑스칼리버' }, { base: '’' }, { base: '!' }]));
  it('낱말 + 독음, 한자 주석', () => {
    expect(parseRuby('고유결계(리얼리티 마블)를 편다')).toEqual([{ base: '고유결계', rt: '리얼리티 마블' }, { base: '를 편다' }]);
    expect(parseRuby('순식간에 사선(死線) 위로')).toEqual([{ base: '순식간에 ' }, { base: '사선', rt: '死線' }, { base: ' 위로' }]);
  });
  it('숫자·기호 괄호는 루비가 아니다', () => {
    expect(parseRuby('무승부 (3국면 소진)')).toEqual([{ base: '무승부 (3국면 소진)' }]);
    expect(parseRuby('판정(13 / 12)')).toEqual([{ base: '판정(13 / 12)' }]);
  });
  it('타이핑 길이는 독음을 세지 않는다', () => expect(visibleLength(parseRuby('‘검(엑스칼리버)’'))).toBe(3));
});
