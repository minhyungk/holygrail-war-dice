// S6_VICTORY / S7_DEFEAT. 패배면 남은 전쟁을 빨리감기한 결과를 보여 준다 (D-043). 목업 문법(title, panel, btn)을 따른다.
import type { RunView } from '../../engine/view';
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
  const myOut = view.eliminated.find((x) => x.faction === P);
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
