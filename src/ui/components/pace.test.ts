import { describe, expect, it } from 'vitest';
import { K } from '../../data/constants';
import { charDelay } from './pace';

describe('출력 리듬 (D-133)', () => {
  const P = K['text.pace'];
  const chant = '모이는 별의 숨결── 받아라, ‘약속된 승리의 검’!';
  it('영창은 느리게, 보구명부터는 빠르게', () => {
    expect(charDelay(chant, 0, 30, 'chant')).toBe(30 * P.chant);
    const nameIdx = chant.indexOf('약');
    expect(charDelay(chant, nameIdx, 30, 'chant')).toBe(30 * P.np_name);
  });
  it('문장 부호 뒤에 쉰다. 같은 부호가 이어지면 마지막 뒤에서만', () => {
    const t = '그래, 좋아. ……정말──!';
    expect(charDelay(t, t.indexOf(','), 30, undefined)).toBe(30 * P.comma);
    expect(charDelay(t, t.indexOf('.'), 30, undefined)).toBe(30 * P.period);
    expect(charDelay(t, t.indexOf('…'), 30, undefined)).toBe(30); // 뒤에 …가 또 온다
    expect(charDelay(t, t.indexOf('…') + 1, 30, undefined)).toBe(30 * P.ellipsis);
  });
});
