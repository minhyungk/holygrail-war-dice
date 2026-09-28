// 전투 화면 연출 층 (D-133). 판정·규칙과 무관한 장식만 그린다.
// 효과는 잠깐 떴다 사라지는 목록으로 관리한다: VS, 국면 배너, 기적, 베기·피해, 방어, 보구, 위험, 소멸, 결과 도장.
import type { CSSProperties } from 'react';
import { clsStyle, LABELS } from './common';
import { RubyText } from './Ruby';

export type FxKind = 'vs' | 'phase' | 'miracle' | 'slash' | 'dmg' | 'guard' | 'np' | 'danger' | 'death' | 'result';
export interface Fx {
  id: number;
  kind: FxKind;
  side?: 'a' | 'c';
  text?: string;
  sub?: string;
  a?: { name: string; cls: string | null };
  c?: { name: string; cls: string | null };
  cls?: string | null;
  tone?: 'win' | 'lose' | 'draw' | 'escape';
}

const sideStyle = (side?: 'a' | 'c'): CSSProperties => (side === 'c' ? { left: '78%' } : side === 'a' ? { left: '22%' } : {});

export function FxLayer({ fx }: { fx: Fx[] }) {
  return (
    <div className="fx-layer" aria-hidden="true">
      {fx.map((f) => {
        switch (f.kind) {
          case 'vs':
            return (
              <div key={f.id} className="fx-vs">
                <div className="vs-side a" style={clsStyle(f.a?.cls ?? null)}>
                  <span className="vs-glyph">{f.a?.cls ? LABELS.glyph[f.a.cls] : '?'}</span>
                  <b>{f.a?.name}</b>
                </div>
                <div className="vs-mark">VS</div>
                <div className="vs-side c" style={clsStyle(f.c?.cls ?? null)}>
                  <span className="vs-glyph">{f.c?.cls ? LABELS.glyph[f.c.cls] : '?'}</span>
                  <b>{f.c?.name}</b>
                </div>
                {f.sub ? <div className="vs-sub">{f.sub}</div> : null}
              </div>
            );
          case 'phase':
            return (
              <div key={f.id} className="fx-phase">
                <i className="streak" />
                <small>{f.sub}</small>
                <b>{f.text}</b>
              </div>
            );
          case 'miracle':
            return (
              <div key={f.id} className="fx-miracle">
                <i className="rays" />
                <b>기적</b>
              </div>
            );
          case 'slash':
            return <div key={f.id} className="fx-slash" style={sideStyle(f.side)} />;
          case 'dmg':
            return (
              <div key={f.id} className="fx-dmg" style={sideStyle(f.side)}>
                {f.text}
              </div>
            );
          case 'guard':
            return (
              <div key={f.id} className="fx-guard" style={sideStyle(f.side)}>
                <i />
                <b>{f.text}</b>
              </div>
            );
          case 'np':
            return (
              <div key={f.id} className={`fx-np ${f.side ?? ''}`} style={clsStyle(f.cls ?? null)}>
                <i className="beam" />
                <b>
                  <RubyText text={f.text ?? ''} />
                </b>
              </div>
            );
          case 'danger':
            return <div key={f.id} className="fx-danger" />;
          case 'death':
            return (
              <div key={f.id} className="fx-death" style={sideStyle(f.side)}>
                {Array.from({ length: 14 }, (_, i) => (
                  <i key={i} style={{ ['--k' as string]: i }} />
                ))}
              </div>
            );
          case 'result':
            return (
              <div key={f.id} className={`fx-result ${f.tone ?? ''}`}>
                <b>{f.text}</b>
              </div>
            );
        }
      })}
    </div>
  );
}

/** 전투 배경: 천천히 도는 마법진과 떠오르는 불씨 */
export function BattleBackdrop({ final }: { final: boolean }) {
  return (
    <div className={`battle-backdrop ${final ? 'final' : ''}`} aria-hidden="true">
      <i className="bd-circle" />
      <div className="bd-embers">
        {Array.from({ length: 22 }, (_, i) => (
          <i key={i} style={{ ['--x' as string]: `${(i * 37) % 100}%`, ['--d' as string]: `${(i * 0.73) % 9}s`, ['--s' as string]: `${7 + ((i * 13) % 7)}s` }} />
        ))}
      </div>
    </div>
  );
}
