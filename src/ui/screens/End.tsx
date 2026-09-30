// S6_VICTORY / S7_DEFEAT. 패배면 남은 전쟁을 빨리감기한 결과를 보여 준다 (D-043). 목업 문법(title, panel, btn)을 따른다.
// 우승하면 먼저 성배 앞에서 소원을 적는다 (D-142). 소원을 빈 뒤 결과를 보인다.
import { useState } from 'react';
import { K } from '../../data/constants';
import type { RunView } from '../../engine/view';
import { REDUCED } from '../fx/circle';
import { Art, clsStyle, LABELS } from '../components/common';
import type { Session } from '../session';
import { buildChronicle, type ChronicleItem } from '../chronicle';
import { T } from '../strings';

export function End({ session, view, onExit }: { session: Session; view: RunView; onExit: () => void }) {
  const P = view.player;
  const win = view.ended?.result === 'victory';
  const [wish, setWish] = useState<string | null>(null);
  const myOut = view.eliminated.find((x) => x.faction === P);
  if (win && wish === null) return <GrailWish onWish={setWish} />;
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
      <WarSummary session={session} view={view} />
      <Chronicle session={session} view={view} />
      <p className="sub">
        {T.seed} {session.plan.seed}
      </p>
      <button className="btn primary" onClick={onExit}>
        {T.backToMain}
      </button>
    </section>
  );
}

/**
 * 전쟁 결산 (D-156): 우승 진영을 크게, 그 아래 모든 진영을 우승 → 늦게 탈락한 순으로.
 * 전쟁이 끝났으므로 진명·마스터를 모두 공개한다
 */
function WarSummary({ session, view }: { session: Session; view: RunView }) {
  const P = view.player;
  const winner = view.ended?.winner ?? null;
  const svOf = (fc: string) => session.data.servants[view.factions[fc]!.servant_id]!;
  const masterOf = (fc: string) => (fc === P ? T.you : (session.data.masters[view.factions[fc]!.master_id ?? '']?.name_ko ?? ''));
  const out = new Map(view.eliminated.map((x) => [x.faction, x]));
  const order = [
    ...(winner ? [winner] : []),
    ...[...view.eliminated].reverse().map((x) => x.faction),
    ...Object.keys(view.factions).filter((fc) => fc !== winner && !out.has(fc)),
  ];
  const row = (fc: string) => {
    const sv = svOf(fc);
    const x = out.get(fc);
    return (
      <li key={fc} className={`ws-row ${fc === P ? 'me' : ''} ${fc === winner ? 'win' : ''}`} style={clsStyle(sv.class)}>
        <Art src={sv.images.face} cls={sv.class} className="ws-face" />
        <div className="ws-who">
          <b>
            {sv.name_ko}
            {fc === P ? <span className="ws-tag">{T.youTag}</span> : null}
          </b>
          <small>
            {LABELS.cls[sv.class]} · {masterOf(fc)}
          </small>
        </div>
        <span className="ws-out">{fc === winner ? T.winTag : x ? T.outcome(T.dayN(x.day), T.elimHow[x.cause] ?? x.cause, x.by ? svOf(x.by).name_ko : null) : ''}</span>
      </li>
    );
  };
  return (
    <div className="panel war-sum">
      <h4>{T.warSummary}</h4>
      {winner ? (
        <div className="ws-winner" style={clsStyle(svOf(winner).class)}>
          <Art src={svOf(winner).images.face} cls={svOf(winner).class} className="ws-face" />
          <div>
            <small>{T.winnerLabel}</small>
            <b>{svOf(winner).name_ko}</b>
            <span>
              {LABELS.cls[svOf(winner).class]} · {masterOf(winner)}
            </span>
          </div>
        </div>
      ) : (
        <p className="sub">{T.noWinner}</p>
      )}
      <ol className="ws-list">{order.map(row)}</ol>
    </div>
  );
}

/** 전쟁 연대기 (D-166): 날짜·시간대별 전투·처치/방면·탈락. 전쟁이 끝났으므로 진명을 모두 공개한다 */
function Chronicle({ session, view }: { session: Session; view: RunView }) {
  const P = view.player;
  const sections = buildChronicle(session.log.events, P);
  const svOf = (fc: string) => session.data.servants[view.factions[fc]!.servant_id]!;
  const nm = (fc: string | null | undefined) => (fc ? (svOf(fc).name_short_ko ?? svOf(fc).name_ko) : '');
  const masterOf = (fc: string) => (fc === P ? T.you : (session.data.masters[view.factions[fc]!.master_id ?? '']?.name_ko ?? ''));
  const C = T.chronicle;
  const text = (it: ChronicleItem): string => {
    switch (it.kind) {
      case 'battle': {
        const head = `${nm(it.factions[0])} ${C.vs} ${nm(it.factions[1])}${it.place ? ` · ${it.place}` : ''}`;
        const res =
          it.result === 'win' ? [C.win(nm(it.winner)), ...(it.dead ? [C.dead(nm(it.dead))] : [])]
          : it.result === 'escape' ? [C.escape(nm(it.escaped))]
          : it.result === 'draw' ? [C.draw]
          : [C.escapeFailed, ...(it.dead ? [C.dead(nm(it.dead))] : [])];
        const np = it.np?.length ? [C.np(it.np.map(nm).join(', '))] : [];
        return [head, ...np, ...res].join(' — ');
      }
      case 'choice':
        return it.choice === 'execute' ? C.execute(masterOf(it.factions[1]!)) : C.release(masterOf(it.factions[1]!));
      case 'out':
        return C.out(nm(it.factions[0]), T.elimHow[it.cause ?? ''] ?? it.cause ?? '', it.by ? nm(it.by) : null);
      case 'final':
        return C.finalStart(it.place ?? '');
    }
  };
  return (
    <div className="panel chronicle">
      <h4>{C.title}</h4>
      {sections.length ? (
        sections.map((sec, i) => (
          <section key={i} className="ch-sec">
            <h5>{sec.time === 'final' ? C.final : `${T.dayN(sec.day)} ${T.time[sec.time]}`}</h5>
            <ul>
              {sec.items.map((it, k) => (
                <li key={k} className={`ch-${it.kind} ${it.mine || it.factions.includes(P) ? 'mine' : ''} ${it.dead || it.kind === 'out' ? 'dead' : ''}`}>
                  <span className="ch-faces">
                    {it.factions.slice(0, 2).map((fc) => (
                      <Art key={fc} src={svOf(fc).images.face} cls={svOf(fc).class} />
                    ))}
                  </span>
                  <span className="ch-text">
                    {it.mine ? <b className="ch-tag">{C.mine}</b> : null}
                    {text(it)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))
      ) : (
        <p className="sub">{C.empty}</p>
      )}
    </div>
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

/** 성배: Atlas 성배 이미지 (D-154). 경로는 labels.json */
function Grail() {
  return <img className="grail" src={LABELS.grail} alt="" />;
}
