// 공통 조각 (prototype/mockup 마크업 그대로). 클래스 이름·문장은 data/common/labels.json에서 받는다.
import type { CSSProperties, ReactNode } from 'react';
import { useEffect, useState } from 'react';

export const LABELS = { glyph: {} as Record<string, string>, cls: {} as Record<string, string>, unknown: '' };
export const setLabels = (l: { class_glyph: Record<string, string>; class_name: Record<string, string>; unknown_servant: string }) => {
  Object.assign(LABELS.glyph, l.class_glyph);
  Object.assign(LABELS.cls, l.class_name);
  LABELS.unknown = l.unknown_servant;
};
export const clsVar = (c: string) => `var(--class-${c})`;
export const clsStyle = (c: string | null): CSSProperties => (c ? ({ ['--cls' as string]: clsVar(c) } as CSSProperties) : {});

export function Glyph({ cls, hidden, style }: { cls: string; hidden?: boolean; style?: CSSProperties }) {
  return (
    <span className="glyph" style={{ ...clsStyle(hidden ? null : cls), ...style }}>
      {hidden ? '?' : (LABELS.glyph[cls] ?? '?')}
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
