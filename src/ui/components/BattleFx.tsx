// 전투 화면 연출 층 (D-133). 판정·규칙과 무관한 장식만 그린다.
// 효과는 잠깐 떴다 사라지는 목록으로 관리한다: VS, 국면 배너, 기적, 베기·피해, 방어, 보구(컷인), 위험, 소멸, 결과 도장, 스킬 발동, 약점 공략, 역전 (D-151).
import type { CSSProperties } from 'react';
import { K } from '../../data/constants';
import { Art, clsStyle, Glyph } from './common';
import { RubyText } from './Ruby';

export type FxKind = 'vs' | 'phase' | 'miracle' | 'slash' | 'dmg' | 'guard' | 'np' | 'danger' | 'death' | 'result' | 'skill' | 'weakness' | 'comeback';
export interface Fx {
  id: number;
  kind: FxKind;
  side?: 'a' | 'c';
  text?: string;
  sub?: string;
  a?: { name: string; cls: string | null; img?: string };
  c?: { name: string; cls: string | null; img?: string };
  cls?: string | null;
  tone?: 'win' | 'lose' | 'draw' | 'escape';
  /** 같은 순간에 뜬 효과의 순번 (쌓아 보이기) */
  n?: number;
  /** 보구 컷인의 서번트 일러스트 (Atlas charaGraph, D-151) */
  img?: string;
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
                  {f.a?.img && f.a.cls ? <Art src={f.a.img} cls={f.a.cls} className="vs-glyph vs-face" /> : f.a?.cls ? <Glyph cls={f.a.cls} /> : <span className="vs-glyph">?</span>}
                  <b>{f.a?.name}</b>
                </div>
                <div className="vs-mark">VS</div>
                <div className="vs-side c" style={clsStyle(f.c?.cls ?? null)}>
                  {f.c?.img && f.c.cls ? <Art src={f.c.img} cls={f.c.cls} className="vs-glyph vs-face" /> : f.c?.cls ? <Glyph cls={f.c.cls} /> : <span className="vs-glyph">?</span>}
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
                {f.img ? <img className="np-art" src={f.img} alt="" referrerPolicy="no-referrer" /> : null}
                <i className="beam" />
                <b>
                  <RubyText text={f.text ?? ''} />
                </b>
              </div>
            );
          case 'danger':
            return <div key={f.id} className="fx-danger" />;
          case 'death': {
            // 소멸 (D-164): 일러스트(StandArt)가 금빛으로 물든 뒤 아래에서 위로 사라진다. 여기서는 사라지는 경계에서 피어오르는 금빛 입자
            const cfg = K['text.death_fx'];
            const vanish = cfg.duration_ms - cfg.gild_ms;
            return (
              <div key={f.id} className="fx-death" style={{ ...sideStyle(f.side), ['--death-gild' as string]: `${cfg.gild_ms}ms` }}>
                <b className="fx-death-flare" />
                {Array.from({ length: cfg.particles }, (_, i) => {
                  const t = i / cfg.particles; // 경계가 올라간 정도 (0 = 발끝, 1 = 머리)
                  const spread = (((i * 37) % 100) / 100 - 0.5) * cfg.spread_px; // 결정적 배치 (무작위 금지)
                  return (
                    <i
                      key={i}
                      style={{
                        ['--x0' as string]: `${spread}px`,
                        ['--y0' as string]: `${(0.5 - t) * cfg.span_px}px`,
                        ['--dx' as string]: `${spread * 0.25}px`,
                        ['--rise' as string]: `${cfg.rise_px}px`,
                        ['--p-dur' as string]: `${vanish * 0.55}ms`,
                        ['--delay' as string]: `${cfg.gild_ms + t * vanish * 0.8}ms`,
                      }}
                    />
                  );
                })}
              </div>
            );
          }
          case 'skill':
            // 스킬 발동 (D-142): 발동한 쪽 카드 위에 이름표. 같은 순간 여러 개면 아래로 쌓인다 (n = 순번)
            return (
              <div key={f.id} className={`fx-skill ${f.side ?? ''}`} style={{ ...sideStyle(f.side), ['--n' as string]: f.n ?? 0 }}>
                <small>✦ {f.sub}</small>
                <b>{f.text}</b>
              </div>
            );
          case 'weakness':
            // 약점 공략 (D-148): 진명을 아는 자만 쓰는 수. 금빛 사선과 국면 이름
            return (
              <div key={f.id} className="fx-weak">
                <i className="cut" />
                <small>{f.sub}</small>
                <b>{f.text}</b>
              </div>
            );
          case 'comeback':
            // 역전승 (D-151): 위험까지 몰렸다가 이겼다
            return (
              <div key={f.id} className="fx-comeback" style={clsStyle(f.cls ?? null)}>
                <i className="rays" />
                {f.img ? <img className="cb-art" src={f.img} alt="" referrerPolicy="no-referrer" /> : null}
                <b>{f.text}</b>
                <small>{f.sub}</small>
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
