// 글자별 출력 간격 (D-133). 보구 영창은 천천히, ‘보구명’과 !!는 빠르게. 문장 부호 뒤에는 숨을 고른다.
import { K } from '../../data/constants';

/**
 * visible: 화면에 보이는 글자열(루비 독음 제외). i: 방금 친 글자의 위치.
 * 반환: 다음 글자까지 기다릴 ms
 */
export function charDelay(visible: string, i: number, baseMs: number, pace: 'chant' | 'dramatic' | undefined): number {
  const P = K['text.pace'];
  const c = visible[i] ?? '';
  const next = visible[i + 1] ?? '';
  let mult = pace === 'chant' ? P.chant : pace === 'dramatic' ? P.dramatic : 1;
  if (pace === 'chant') {
    // ‘ 이후(보구명)부터 끝까지는 몰아친다
    const open = visible.indexOf('‘');
    if (open >= 0 && i >= open) mult = P.np_name;
  }
  // 문장 부호: 같은 부호가 이어지는 동안에는 쉬지 않고, 마지막 뒤에서 쉰다
  if (c === next) return baseMs * mult;
  if (c === '…') return baseMs * mult * P.ellipsis;
  if (c === '─') return baseMs * mult * P.dash;
  if (c === ',' || c === '、') return baseMs * mult * P.comma;
  if (c === '.' || c === '。' || c === '?' || c === '？') return baseMs * mult * P.period;
  if (c === '!' || c === '！') return baseMs * (pace === 'chant' ? P.np_name : mult) * P.bang;
  return baseMs * mult;
}
