// 공통 UI 조각. 클래스 이름·문장은 data/common/labels.json에서 받는다.
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { pipLayout, pipRadius } from '../fx/pips';

export const LABELS = { glyph: {} as Record<string, string>, icon: {} as Record<string, string>, cls: {} as Record<string, string>, unknown: '', grail: '' };
export const setLabels = (l: { class_glyph: Record<string, string>; class_icon: Record<string, string>; class_name: Record<string, string>; unknown_servant: string; grail_image: string }) => {
  Object.assign(LABELS.glyph, l.class_glyph);
  Object.assign(LABELS.icon, l.class_icon);
  Object.assign(LABELS.cls, l.class_name);
  LABELS.unknown = l.unknown_servant;
  LABELS.grail = l.grail_image;
};
export const clsVar = (c: string) => `var(--class-${c})`;
export const clsStyle = (c: string | null): CSSProperties => (c ? ({ ['--cls' as string]: clsVar(c) } as CSSProperties) : {});

export function Glyph({ cls, hidden, style }: { cls: string; hidden?: boolean; style?: CSSProperties }) {
  const [failed, setFailed] = useState(false);
  const icon = hidden ? null : LABELS.icon[cls];
  return (
    <span className="glyph" style={{ ...clsStyle(hidden ? null : cls), ...style }}>
      {icon && !failed ? <img src={icon} alt="" onError={() => setFailed(true)} /> : hidden ? '?' : (LABELS.glyph[cls] ?? '?')}
    </span>
  );
}

/** 영주 이미지: 소모된 획을 회색으로 바꾼 화면용 (public/assets/seals/ui, 03-ui-style.md §8) */
export const sealSrc = (n: number) => `./assets/seals/ui/seal${Math.max(0, Math.min(3, n))}.png`;

/** 합산 줄: 붙은 뒤 한 프레임 뒤에 .in으로 나타난다 (목업 addLn) */
export function Ln({ children, className }: { children: ReactNode; className?: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    return () => cancelAnimationFrame(r);
  }, []);
  return <div className={`ln ${shown ? 'in' : ''} ${className ?? ''}`}>{children}</div>;
}

/** 영주 표시: 획이 줄면 빛나며 한 획 사라진다 (D-072 영주 이미지) */
export function SealIcon({ n, max }: { n: number; max: number }) {
  const [shown, setShown] = useState(n);
  const [burn, setBurn] = useState(false);
  useEffect(() => {
    if (n >= shown) {
      setShown(n);
      return;
    }
    setBurn(true);
    const a = window.setTimeout(() => setShown(n), 700);
    const b = window.setTimeout(() => setBurn(false), 1400);
    return () => (window.clearTimeout(a), window.clearTimeout(b));
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <span className={`seal ${burn ? 'burn' : ''}`} title="영주">
      <img alt="" src={sealSrc(shown)} />
      <span>
        영주 <b className="val">{shown}</b>/{max}
      </span>
    </span>
  );
}

/** Atlas 이미지. 불러오지 못하면 클래스 문장으로 대체 (Q-135) */
export function Art({ src, cls, className, hidden }: { src: string; cls: string; className?: string; hidden?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (hidden || failed) return <Glyph cls={cls} hidden={hidden} />;
  return <img className={className} src={src} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}

/** 합산 줄의 주사위 한 개: 숫자 대신 눈. 값을 모르면(상대가 굴리는 중) '?' */
export function DieFace({ n }: { n: number | null }) {
  return (
    <svg className="dface" viewBox="0 0 100 100" role="img" aria-label={n === null ? '?' : String(n)}>
      <rect x="4" y="4" width="92" height="92" rx="20" />
      {n === null ? (
        <text x="50" y="52">?</text>
      ) : (
        pipLayout(n).map(([u, v], i) => <circle key={i} className={n === 1 ? 'ace' : ''} cx={6 + u * 88} cy={6 + v * 88} r={pipRadius(n) * 88} />)
      )}
    </svg>
  );
}
