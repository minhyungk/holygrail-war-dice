// S6_VICTORY / S7_DEFEAT. 패배면 남은 전쟁을 빨리감기한 결과를 보여 준다 (D-043). 목업 문법(title, panel, btn)을 따른다.
// 우승하면 먼저 성배 앞에서 소원을 적는다 (D-142). 소원을 빈 뒤 결과를 보인다.
import { useState } from 'react';
import { K } from '../../data/constants';
import type { RunView } from '../../engine/view';
import { REDUCED } from '../fx/circle';
import { Art } from '../components/common';
import type { Session } from '../session';
import { T } from '../strings';

export function End({ session, view, onExit }: { session: Session; view: RunView; onExit: () => void }) {
  const P = view.player;
  const win = view.ended?.result === 'victory';
  const real = (fc: string) => {
    const f = view.factions[fc];
    if (!f) return fc;
    const s = session.data.servants[f.servant_id]!;
    const m = f.master_id ? session.data.masters[f.master_id]?.name_ko : null;
    return m ? `${s.name_ko} (${m})` : s.name_ko;
  };
  const [wish, setWish] = useState<string | null>(null);
  const myOut = view.eliminated.find((x) => x.faction === P);
  if (win && wish === null) return <GrailWish onWish={setWish} />;
  const after = myOut ? view.eliminated.slice(view.eliminated.indexOf(myOut) + 1) : view.eliminated;
  return (
    <section className="screen s-end">
      {(() => {
        const sv = session.data.servants[view.factions[P]!.servant_id]!;
        // 우승 시 최종 영기재림, 패배 시 기본 재림 (Q-134)
        return <Art className="final-art" src={win ? sv.images.final : sv.images.summon} cls={sv.class} />;
      })()}
      <h1 className="title">{win ? T.victoryTitle : T.defeatTitle}</h1>
      <p className="sub">{win ? T.victoryBody : T.defeatCause[myOut?.cause ?? 'killed']}</p>
      {win && wish ? (
        <figure className="wish-made">
          <figcaption>{T.wishMade}</figcaption>
          <blockquote>“{wish}”</blockquote>
        </figure>
      ) : null}
      {win ? <p className="sub">{T.epiloguePending}</p> : null}
      <div className="panel">
        <h4>{win ? '탈락 순서' : T.fastForward}</h4>
        <ol>
          {after.map((x, i) => (
            <li key={i}>
              {T.dayN(x.day)} — {real(x.faction)}
              {x.by ? ` ← ${real(x.by)}` : ''}
            </li>
          ))}
        </ol>
      </div>
      <p>
        <b>{T.finalWinner(view.ended?.winner ? real(view.ended.winner) : '—')}</b>
      </p>
      <p className="sub">
        {T.seed} {session.plan.seed}
      </p>
      <button className="btn primary" onClick={onExit}>
        {T.backToMain}
      </button>
    </section>
  );
}

/** 성배와 소원 입력 (D-142). 빌면 성배가 빛나고 잠시 뒤 결과로 넘어간다 */
function GrailWish({ onWish }: { onWish: (text: string) => void }) {
  const [text, setText] = useState('');
  const [granting, setGranting] = useState(false);
  const max = K['text.wish_max_chars'];
  const trimmed = text.trim();
  const submit = () => {
    if (!trimmed || granting) return;
    setGranting(true);
    window.setTimeout(() => onWish(trimmed), REDUCED ? 0 : K['text.wish_grant_ms']);
  };
  return (
    <section className={`screen s-grail ${granting ? 'granting' : ''}`}>
      <div className="grail-stage" aria-hidden="true">
        <i className="grail-halo" />
        <Grail />
        <div className="grail-motes">
          {Array.from({ length: 16 }, (_, i) => (
            <i key={i} style={{ ['--x' as string]: `${(i * 41) % 100}%`, ['--d' as string]: `${(i * 0.61) % 5}s` }} />
          ))}
        </div>
      </div>
      <h1 className="title">{T.grail}</h1>
      <form
        className="wish-form"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label htmlFor="wish">{T.wishLabel}</label>
        <textarea id="wish" value={text} maxLength={max} rows={3} placeholder={T.wishPlaceholder} disabled={granting} onChange={(e) => setText(e.target.value)} />
        <div className="wish-row">
          <small>{T.wishCount(text.length, max)}</small>
          <button className="btn primary" type="submit" disabled={!trimmed || granting}>
            {T.wishSubmit}
          </button>
        </div>
      </form>
      {granting ? <blockquote className="wish-rising">“{trimmed}”</blockquote> : null}
    </section>
  );
}

/** 성배: 금빛 잔 (SVG). 색은 토큰 */
function Grail() {
  return (
    <svg className="grail" viewBox="0 0 200 240" role="img">
      <defs>
        <linearGradient id="grail-gold" x1="0" x2="1">
          <stop offset="0" stopColor="var(--grail-dark)" />
          <stop offset=".35" stopColor="var(--grail-light)" />
          <stop offset=".55" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--grail-dark)" />
        </linearGradient>
        <radialGradient id="grail-fill" cx=".5" cy=".3" r=".7">
          <stop offset="0" stopColor="var(--miracle)" stopOpacity=".95" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* 잔 (위가 넓은 그릇) */}
      <path d="M38 40 Q100 30 162 40 Q160 104 118 124 L112 128 L88 128 L82 124 Q40 104 38 40 Z" fill="url(#grail-gold)" />
      <ellipse cx="100" cy="40" rx="62" ry="10" fill="var(--grail-dark)" />
      <ellipse className="grail-light" cx="100" cy="40" rx="56" ry="7" fill="url(#grail-fill)" />
      {/* 띠 장식 */}
      <path d="M46 70 Q100 82 154 70" fill="none" stroke="var(--grail-light)" strokeWidth="3" opacity=".8" />
      <circle cx="100" cy="92" r="7" fill="var(--danger)" stroke="var(--grail-light)" strokeWidth="2" />
      {/* 기둥과 매듭 */}
      <rect x="92" y="126" width="16" height="50" rx="4" fill="url(#grail-gold)" />
      <ellipse cx="100" cy="150" rx="16" ry="8" fill="url(#grail-gold)" />
      {/* 받침 */}
      <path d="M100 172 Q70 190 52 214 L148 214 Q130 190 100 172 Z" fill="url(#grail-gold)" />
      <ellipse cx="100" cy="214" rx="48" ry="9" fill="var(--grail-dark)" />
    </svg>
  );
}
