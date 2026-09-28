// 루비(윗첨자 독음) 표시 (D-070 표기 → D-117 화면). 데이터는 `본문(독음)` 그대로 두고 화면에서만 루비로 바꾼다.
//  - ‘약속된 승리의 검(엑스칼리버)’ → 따옴표 안 전체가 본문
//  - 고유결계(리얼리티 마블), 사선(死線) → 괄호 바로 앞 낱말이 본문
// 숫자·기호만 든 괄호(판정값 등)는 루비로 보지 않는다. 시스템 문구에는 쓰지 않는다.
import type { ReactNode } from 'react';

export type Seg = { base: string; rt?: string };

const QUOTED = /‘([^’()]+)\(([^)]+)\)’/y;
const WORD = /([^\s‘’()「」『』.,!?…─]+)\(([^)]+)\)/y;
const hasLetter = (s: string) => /[가-힣一-龥ぁ-んァ-ンA-Za-z]/.test(s);
const okRt = (s: string) => hasLetter(s) && !/[0-9/→:·]/.test(s);

export function parseRuby(text: string): Seg[] {
  const out: Seg[] = [];
  let plain = '';
  let i = 0;
  const flush = () => {
    if (plain) out.push({ base: plain });
    plain = '';
  };
  while (i < text.length) {
    QUOTED.lastIndex = i;
    const q = QUOTED.exec(text);
    if (q && okRt(q[2]!)) {
      flush();
      out.push({ base: '‘' }, { base: q[1]!, rt: q[2]! }, { base: '’' });
      i = QUOTED.lastIndex;
      continue;
    }
    WORD.lastIndex = i;
    const w = text[i - 1] === undefined || /[\s‘「『(─…]/.test(text[i - 1]!) ? WORD.exec(text) : null;
    if (w && hasLetter(w[1]!) && okRt(w[2]!)) {
      flush();
      out.push({ base: w[1]!, rt: w[2]! });
      i = WORD.lastIndex;
      continue;
    }
    plain += text[i];
    i++;
  }
  flush();
  return out;
}

/** 화면 글자 수 (루비 독음은 세지 않는다). 타이핑 길이 기준 */
export const visibleLength = (segs: Seg[]) => segs.reduce((n, s) => n + s.base.length, 0);

/** shown 글자까지만 보인다. 루비 독음은 본문을 다 친 뒤에 떠오른다 */
export function RubyText({ text, shown }: { text: string; shown?: number }) {
  const segs = parseRuby(text);
  let left = shown ?? Infinity;
  const nodes: ReactNode[] = [];
  segs.forEach((s, k) => {
    if (left <= 0) return;
    const part = s.base.slice(0, left);
    left -= s.base.length;
    if (!s.rt) nodes.push(part);
    else
      nodes.push(
        <ruby key={k}>
          {part}
          <rt className={part.length === s.base.length ? 'in' : ''}>{s.rt}</rt>
        </ruby>,
      );
  });
  return <>{nodes}</>;
}
