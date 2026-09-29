// 화면 흐름 (02-screens-flow.md): 메인 → 소환 → 판 진행(맵·조우·전투) → 우승/패배 → 메인
import { useEffect, useState } from 'react';
import { K } from '../data/constants';
import { loadNarrationCommon, loadRunDialogue } from '../data/load';
import type { RunPlan } from '../engine/run';
import { createRng } from '../engine/rng';
import { LABELS, setLabels } from './components/common';
import { Game } from './screens/Game';
import { Main } from './screens/Main';
import { CatalystPick, SummonReveal } from './screens/Summon';
import { type Catalog, loadCatalog, makePlan, newSeed, type Session, startSession } from './session';
import { T } from './strings';

type Stage = { s: 'main' } | { s: 'catalyst' } | { s: 'summon'; plan: RunPlan; session: Session | null } | { s: 'game'; session: Session };
type Quote = { text: string; name: string; cls: string };

export function App() {
  const [stage, setStage] = useState<Stage>({ s: 'main' });
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [chant, setChant] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [fatePoints, setFatePoints] = useState<number>(K['dice.fate_point_init']);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([loadCatalog(), loadNarrationCommon()]).then(async ([cat, common]) => {
      setLabels(common.labels);
      setChant(common.chant);
      setCatalog(cat);
      setReady(true);
      // 메인 타이틀: 무작위 서번트의 소환 대사 (02-screens-flow.md S0 "타이틀(소환대사)")
      const s = cat.servants[createRng(newSeed()).int(0, cat.servants.length - 1)]!;
      const [d] = (await loadRunDialogue([s.servant_id], [])).servants;
      const line = d?.tags.summon?.[0];
      if (line) setQuote({ text: line.text, name: s.name_ko, cls: LABELS.cls[s.class] ?? s.class });
    }, (e) => setError(String(e)));
  }, []);

  const summon = (mode: 'random' | 'catalyst', catalyst?: string) => {
    if (mode === 'catalyst' && !catalyst) return setStage({ s: 'catalyst' });
    const plan = makePlan(catalog!, newSeed(), mode, catalyst);
    setStage({ s: 'summon', plan, session: null });
    startSession(plan, fatePoints).then(
      (session) => setStage((st) => (st.s === 'summon' && st.plan === plan ? { ...st, session } : st)),
      (e) => setError(String(e)),
    );
  };

  let body;
  if (error) body = <section className="screen s-main"><div className="main-inner">{error}</div></section>;
  else if (!ready) body = <section className="screen s-main"><div className="main-inner main-stat">{T.loading}</div></section>;
  else if (stage.s === 'main') body = <Main quote={quote} fatePoints={fatePoints} setFatePoints={setFatePoints} onSummon={(m) => summon(m)} />;
  else if (stage.s === 'catalyst') body = <CatalystPick servants={catalog!.servants} onPick={(id) => summon('catalyst', id)} />;
  else if (stage.s === 'summon')
    body = <SummonReveal key={stage.plan.seed} plan={stage.plan} session={stage.session} chant={chant} onStart={() => stage.session && setStage({ s: 'game', session: stage.session })} />;
  else body = <Game session={stage.session} onExit={() => setStage({ s: 'main' })} />;

  return <div className="app">{body}</div>;
}
