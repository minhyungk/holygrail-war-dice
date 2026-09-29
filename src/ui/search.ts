// 서번트 이름 검색 (촉매 소환, D-157). 화면용 도구이며 게임 규칙과 무관하다.
// - 부분 일치: "훌린" → 쿠 훌린
// - 초성: "ㅇㅌㄹㅇ" → 알트리아, "ㄱ" → 가·각·간…으로 시작하는 글자
// - 입력 중인 글자: 마지막 글자가 받침 없는 음절이면 같은 초성·중성의 모든 글자("가" → 가, 각, 간…),
//   받침이 있으면 그 받침이 다음 글자의 초성으로 넘어가는 경우도 맞춘다("앝" → 알트리아)
const BASE = 0xac00;
const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
/** 종성 번호(1~27) → 다음 글자로 넘어갈 때의 초성. 겹받침은 뒤 자음 */
const JONG_TO_CHO = ['', 'ㄱ', 'ㄲ', 'ㅅ', 'ㄴ', 'ㅈ', 'ㅎ', 'ㄷ', 'ㄹ', 'ㄱ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅌ', 'ㅍ', 'ㅎ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
/** 겹받침의 앞 자음만 남긴 종성 번호 (예: ㄺ → ㄹ) */
const JONG_FRONT: Record<number, number> = { 3: 1, 5: 4, 6: 4, 9: 8, 10: 8, 11: 8, 12: 8, 13: 8, 14: 8, 15: 8, 18: 17 };

const isSyllable = (c: string) => c >= '가' && c <= '힣';
const parts = (c: string) => {
  const k = c.charCodeAt(0) - BASE;
  return { cho: Math.floor(k / 588), jung: Math.floor((k % 588) / 28), jong: k % 28 };
};
const choOf = (c: string) => (isSyllable(c) ? CHO[parts(c).cho]! : c);
const isCho = (c: string) => CHO.includes(c);

/** 공백·가운뎃점·괄호 등을 빼고 소문자로 */
export const normalize = (s: string) => s.toLowerCase().replace(/[\s·・()（）［］[\]"“”'‘’.,\-_=&]/g, '');

/** 이름의 i번째 글자부터 질의가 맞는가. 맞으면 소비한 이름 글자 수, 아니면 -1 */
function matchAt(name: string, i: number, q: string): number {
  let at = i;
  for (let k = 0; k < q.length; k++) {
    const qc = q[k]!;
    const nc = name[at];
    if (nc === undefined) return -1;
    const last = k === q.length - 1;
    if (isCho(qc)) {
      if (choOf(nc) !== qc) return -1;
    } else if (last && isSyllable(qc) && isSyllable(nc)) {
      const a = parts(qc);
      const b = parts(nc);
      if (a.cho !== b.cho || a.jung !== b.jung) return -1;
      if (a.jong !== 0 && a.jong !== b.jong) {
        // 입력 중: 받침(또는 겹받침의 뒤 자음)이 다음 글자의 초성으로 넘어간다
        const front = JONG_FRONT[a.jong] ?? 0;
        const next = name[at + 1];
        if (b.jong !== front || next === undefined || choOf(next) !== JONG_TO_CHO[a.jong]) return -1;
        at += 1;
      }
    } else if (qc !== nc) return -1;
    at += 1;
  }
  return at - i;
}

/** 점수: 0 = 맞지 않음. 앞에서 맞을수록 높다 */
export function matchScore(name: string, query: string): number {
  const q = normalize(query);
  if (!q) return 1;
  const n = normalize(name);
  for (let i = 0; i < n.length; i++) if (matchAt(n, i, q) >= 0) return i === 0 ? 3 : 2;
  return 0;
}
