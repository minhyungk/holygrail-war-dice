// VN 텍스트박스와 선택지 (03-ui-style.md §6, D-122).
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { K } from '../../data/constants';
import { REDUCED } from '../fx/circle';
import type { ShownLine } from '../session';
import { charDelay } from './pace';
import { parseRuby, RubyText, visibleLength } from './Ruby';

const SPEEDS = [
  ['느림', 'slow'],
  ['보통', 'normal'],
  ['빠름', 'fast'],
] as const;

/**
 * VN 텍스트박스 (03-ui-style.md §6, D-122): 줄이 끊기지 않고 이어서 흘러나오며 위로 스크롤된다.
 * log의 마지막 줄을 타이핑한다(typing일 때). 자동(기본 켜짐)이면 다 친 뒤 잠깐 쉬고 다음 줄로, 끄면 탭할 때 다음 줄로.
 * 탭: 타이핑 중이면 즉시 완성.
 */
export function Vn({ log, typing, onLineDone, onLog, autoDefault = true }: { log: ShownLine[]; typing: boolean; onLineDone: () => void; onLog: () => void; autoDefault?: boolean }) {
  const [progress, setProgress] = useState<{ line: ShownLine | undefined; count: number }>({ line: undefined, count: 0 });
  const [auto, setAuto] = useState(autoDefault);
  const [sp, setSp] = useState(1);
  const box = useRef<HTMLDivElement>(null);
  const cur = typing ? log[log.length - 1] : undefined;
  const full = cur?.text ?? '';
  const ruby = cur?.kind !== 'system';
  const visible = cur ? (ruby ? parseRuby(full).map((sg) => sg.base).join('') : full) : '';
  const len = cur ? (ruby ? visibleLength(parseRuby(full)) : full.length) : 0;
  // 새 줄은 첫 렌더부터 0글자. 같은 본문·같은 로그 길이여도 이전 줄의 진행도를 쓰지 않는다.
  const n = progress.line === cur ? progress.count : REDUCED ? len : 0;
  const done = !cur || n >= len;

  useEffect(() => {
    if (!cur || done) return;
    // 글자마다 리듬이 다르다 (D-133): 방금 친 글자(n-1)에 따라 다음 글자까지 쉰다
    const base = K['text.typing_ms'][SPEEDS[sp]![1]];
    const ms = n === 0 ? base : charDelay(visible, n - 1, base, cur.pace);
    const t = window.setTimeout(() => setProgress({ line: cur, count: n + 1 }), ms);
    return () => window.clearTimeout(t);
  }, [cur, n, done, sp, visible]);
  useEffect(() => {
    if (!cur || !done || !auto) return;
    const t = window.setTimeout(onLineDone, K['text.line_pause_ms']);
    return () => window.clearTimeout(t);
  }, [cur, done, auto, onLineDone]);
  useEffect(() => {
    const el = box.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [n, log.length]);

  const advance = () => {
    if (!cur) return;
    if (!done) setProgress({ line: cur, count: len });
    else onLineDone();
  };
  if (!log.length) return null;
  return (
    <div
      className="vn flow"
      role="button"
      tabIndex={0}
      aria-label="다음 문장"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('.ctrl button')) return;
        advance();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          advance();
        }
      }}
    >
      <div className="txt" ref={box} aria-live="polite">
        {log.map((l, i) => {
          const typingThis = typing && i === log.length - 1;
          const kind = l.kind === 'system' ? 'sys' : l.kind === 'narration' ? 'narr' : 'say';
          return (
            <p key={i} className={`vl ${kind} ${l.voice ? `v-${l.voice}` : ''} ${typingThis ? 'cur' : ''}`}>
              {l.speaker ? <b className="spk">{l.speaker}</b> : null}
              {l.draft && l.kind === 'line' ? <span className="draft">draft</span> : null}
              <span className="body">
                {l.kind === 'system' ? (typingThis ? l.text.slice(0, n) : l.text) : <RubyText text={l.text} shown={typingThis ? n : undefined} />}
              </span>
            </p>
          );
        })}
      </div>
      <div className="ctrl">
        <div className="l">
          <button type="button" onClick={onLog}>
            기록
          </button>
          <button type="button" className={auto ? 'on' : ''} onClick={() => setAuto(!auto)}>
            자동
          </button>
          <button type="button" onClick={() => setSp((sp + 1) % 3)}>
            속도 {SPEEDS[sp]![0]}
          </button>
        </div>
        <span className="next" hidden={!cur || !done || auto}>
          ▼
        </span>
      </div>
    </div>
  );
}

export interface ChoiceOpt {
  label: string;
  value: unknown;
  primary?: boolean;
  blocked?: string;
}
export function Choices({ question, opts, onPick, low = true, extra }: { question: string; opts: ChoiceOpt[]; onPick: (v: unknown) => void; low?: boolean; extra?: ReactNode }) {
  const [why, setWhy] = useState('');
  return (
    <div className={`choices ${low ? 'low' : ''}`}>
      {extra}
      {question ? <div className="q">{question}</div> : null}
      {opts.map((o, k) => (
        <button key={k} className={`btn ${o.primary ? 'primary' : ''}`} onClick={() => (o.blocked ? setWhy(o.blocked) : onPick(o.value))}>
          {o.label}
        </button>
      ))}
      <div className="why">{why}</div>
    </div>
  );
}
