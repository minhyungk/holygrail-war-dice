// 조사 자동 처리 (narrative-engine.md §7.3).
export const JOSA_PAIRS = ['이/가', '은/는', '을/를', '와/과', '으로/로'] as const;
export type JosaPair = (typeof JOSA_PAIRS)[number];

/** 마지막 글자의 종성 번호 (0 = 받침 없음). 한글이 아니면 null */
export function finalConsonant(word: string): number | null {
  const c = word.trim().slice(-1);
  if (!c || c < '가' || c > '힣') return null;
  return (c.charCodeAt(0) - 0xac00) % 28;
}

/** word 뒤에 붙일 조사. 한글로 끝나지 않으면 "이(가)" 식으로 둘 다 적는다 (영문 발음표 [TBD]) */
export function josa(word: string, pair: JosaPair): string {
  const [withF, withoutF] = pair.split('/') as [string, string];
  const f = finalConsonant(word);
  if (f === null) return `${withF}(${withoutF})`;
  if (pair === '으로/로') return f === 0 || f === 8 ? '로' : '으로'; // ㄹ 받침도 "로"
  if (pair === '와/과') return f === 0 ? '와' : '과';
  return f === 0 ? withoutF : withF;
}
