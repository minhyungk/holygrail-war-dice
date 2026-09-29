// S1_SUMMON (02-screens-flow.md): 촉매 목록 → 소환 연출 → 카드 + 스테이터스 → 소환 대사(VN) → 시작.
// 연출 순서: 영창(한 줄씩, 마법진이 한 획씩 그려진다) → 기동(회전 가속, 빛기둥, 불티) → 섬광 → 현현(카드).
// 마법진·카드·시트 위에 소환 연출을 얹는다.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { K } from '../../data/constants';
import { CLASSES, EXTRA_CLASSES, STAT_IDS, type ServantProfile } from '../../data/schema';
import { createRng } from '../../engine/rng';
import type { RunPlan } from '../../engine/run';
import { parseRank } from '../../engine/stats';
import { Art, clsStyle, Glyph, LABELS } from '../components/common';
import { matchScore } from '../search';
import { RubyText } from '../components/Ruby';
import { Vn } from '../components/Vn';
import { drawCircle, REDUCED } from '../fx/circle';
import type { Session, ShownLine } from '../session';
import { T } from '../strings';

/**
 * 촉매 소환 (D-157): 서번트가 많아도 고를 수 있게 스크롤 목록 + 클래스 필터 + 이름 검색(초성·입력 중 글자).
 * 엑스트라 클래스를 고르면 난입 소환이 된다 (정규 클래스 한 자리를 대체)
 */
export function CatalystPick({ servants, onPick }: { servants: ServantProfile[]; onPick: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [cls, setCls] = useState<string | null>(null);
  const classes = useMemo(() => CLASSES.filter((c) => servants.some((s) => s.class === c)), [servants]);
  const order = (c: string) => (CLASSES as readonly string[]).indexOf(c);
  const shown = useMemo(() => {
    const scored = servants
      .filter((s) => !cls || s.class === cls)
      .map((s) => ({ s, score: Math.max(matchScore(s.name_ko, query), s.name_short_ko ? matchScore(s.name_short_ko, query) : 0) }))
      .filter((x) => x.score > 0);
    return scored.sort((a, b) => b.score - a.score || order(a.s.class) - order(b.s.class) || a.s.source_id - b.s.source_id).map((x) => x.s);
  }, [servants, cls, query]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <section className="screen s-summon">
      <div className="catalyst">
        <h2>{T.catalystTitle}</h2>
        <p>{T.catalystHint}</p>
        <input
          className="cat-search"
          type="search"
          value={query}
          placeholder={T.catalystSearch}
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && shown[0]) onPick(shown[0].servant_id);
          }}
        />
        <div className="cat-filter" role="group">
          <button className={`chip ${cls === null ? 'on' : ''}`} onClick={() => setCls(null)}>
            {T.catalystAll}
          </button>
          {classes.map((c) => (
            <button key={c} className={`chip ${cls === c ? 'on' : ''}`} style={clsStyle(c)} onClick={() => setCls(cls === c ? null : c)} title={LABELS.cls[c]}>
              <Glyph cls={c} />
              <span>{LABELS.cls[c]}</span>
            </button>
          ))}
        </div>
        <small className="cat-count">{T.catalystCount(shown.length)}</small>
        <div className="cat-list">
          {shown.length ? (
            shown.map((s) => (
              <button key={s.servant_id} className="cat-item" style={clsStyle(s.class)} onClick={() => onPick(s.servant_id)}>
                <Art src={s.images.face} cls={s.class} />
                <span>
                  <b>{s.name_ko}</b>
                  <span>
                    {LABELS.cls[s.class]}
                    {(EXTRA_CLASSES as readonly string[]).includes(s.class) ? ` · ${T.catalystExtra}` : ''}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <p className="cat-none">{T.catalystNone}</p>
          )}
        </div>
      </div>
    </section>
  );
}

type Stage = 'chant' | 'ignite' | 'burst' | 'reveal';
const TIMING = K['text.summon_timing'];
const CHAR_MS = TIMING.char_ms;
const HOLD_MS = TIMING.hold_ms;
const IGNITE_MS = TIMING.ignite_ms;
const BURST_MS = TIMING.burst_ms;

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
}

export function SummonReveal({ plan, session, chant, onStart }: { plan: RunPlan; session: Session | null; chant: string[]; onStart: () => void }) {
  const [stage, setStage] = useState<Stage>(REDUCED ? 'reveal' : 'chant');
  const [lineIdx, setLineIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const [lineDone, setLineDone] = useState(false);
  const floor = useRef<HTMLCanvasElement>(null);
  const fx = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const progressRef = useRef(0);
  const s = session?.data.servants[plan.player_servant_id];
  const ready = !!s && !!session;
  const readyRef = useRef(ready);
  readyRef.current = ready;

  // 영창: 한 글자씩, 줄이 끝나면 잠깐 멈췄다가 다음 줄
  useEffect(() => {
    if (stage !== 'chant') return;
    const line = chant[lineIdx] ?? '';
    progressRef.current = (lineIdx + Math.min(1, chars / Math.max(1, line.length))) / chant.length;
    if (chars < line.length) {
      const t = window.setTimeout(() => setChars((c) => c + 1), CHAR_MS);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => {
      if (lineIdx + 1 < chant.length) {
        setLineIdx(lineIdx + 1);
        setChars(0);
      } else setStage('ignite');
    }, HOLD_MS);
    return () => window.clearTimeout(t);
  }, [stage, lineIdx, chars, chant]);

  // 기동 → (데이터가 준비되면) 섬광 → 현현
  useEffect(() => {
    if (stage === 'ignite') {
      progressRef.current = 1;
      const t = window.setTimeout(function next() {
        if (readyRef.current) setStage('burst');
        else window.setTimeout(next, 200);
      }, IGNITE_MS);
      return () => window.clearTimeout(t);
    }
    if (stage === 'burst') {
      const t = window.setTimeout(() => setStage('reveal'), BURST_MS);
      return () => window.clearTimeout(t);
    }
  }, [stage]);

  // 마법진(바닥) + 불티(화면) 그리기
  useEffect(() => {
    if (stage === 'reveal') return;
    const fl = floor.current, sp = fx.current;
    if (!fl || !sp) return;
    const fctx = fl.getContext('2d')!;
    const sctx = sp.getContext('2d')!;
    const rng = createRng(plan.seed ^ 0x5a5a);
    const sparks: Spark[] = [];
    let rot = 0, speed = 0.15, glow = 0.2, last = performance.now(), raf = 0;
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      const st = stageRef.current;
      const target = st === 'chant' ? 0.25 + progressRef.current * 0.6 : st === 'ignite' ? 5 : 9;
      speed += (target - speed) * Math.min(1, dt * 1.6);
      rot += speed * dt;
      glow += ((st === 'chant' ? 0.25 + progressRef.current * 0.45 : 1) - glow) * Math.min(1, dt * 2);
      drawCircle(fctx, fl.width, rot, glow, st === 'chant' ? progressRef.current : 1);

      // 불티: 영창이 진행될수록, 기동하면 폭발적으로
      const w = (sp.width = sp.clientWidth * Math.min(devicePixelRatio, 2));
      const h = (sp.height = sp.clientHeight * Math.min(devicePixelRatio, 2));
      const cx = w / 2, cy = h * 0.72, rx = Math.min(w * 0.42, h * 0.55), ry = rx * 0.34;
      const rate = st === 'chant' ? progressRef.current * 40 : st === 'ignite' ? 260 : 0;
      for (let n = rate * dt; n > 0; n--) {
        if (n < 1 && rng.next() > n) break;
        const a = rng.next() * Math.PI * 2;
        const inner = st === 'ignite' ? rng.next() : 1;
        sparks.push({
          x: cx + Math.cos(a) * rx * inner,
          y: cy + Math.sin(a) * ry * inner,
          vx: (rng.next() - 0.5) * 30,
          vy: -(60 + rng.next() * (st === 'ignite' ? 420 : 120)),
          life: 0,
          max: 0.8 + rng.next() * 1.6,
          size: 1 + rng.next() * (st === 'ignite' ? 3.2 : 2),
        });
      }
      sctx.clearRect(0, 0, w, h);
      sctx.globalCompositeOperation = 'lighter';
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i]!;
        p.life += dt;
        if (p.life > p.max) {
          sparks.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.99;
        const k = 1 - p.life / p.max;
        const g = sctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        g.addColorStop(0, `rgba(255,236,170,${0.9 * k})`);
        g.addColorStop(1, 'rgba(201,164,92,0)');
        sctx.fillStyle = g;
        sctx.beginPath();
        sctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        sctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [stage === 'reveal', plan.seed]); // eslint-disable-line react-hooks/exhaustive-deps

  // 영창 중 탭: 지금 줄 완성 → 다음 줄
  const tap = useCallback(() => {
    if (stage !== 'chant') return;
    const line = chant[lineIdx] ?? '';
    if (chars < line.length) setChars(line.length);
    else if (lineIdx + 1 < chant.length) {
      setLineIdx(lineIdx + 1);
      setChars(0);
    } else setStage('ignite');
  }, [stage, chant, lineIdx, chars]);

  const line = useMemo(() => (session ? session.narrator.summonLine(plan.player_servant_id) : null), [session, plan.player_servant_id]);
  // 난입 소환이면 소환 대사 앞에 '성배 오류' 나레이션 (D-157)
  const omen = useMemo(() => (session && plan.irregular ? session.narrator.irregularLine() : null), [session, plan.irregular]);

  if (stage !== 'reveal' || !s || !session) {
    return (
      <section className={`screen s-summon summon-stage ${stage} ${stage === 'ignite' ? 'shake' : ''}`} onClick={tap}>
        <div className="ss-floor-wrap">
          <canvas ref={floor} className="ss-floor" width={900} height={900} />
        </div>
        <div className="ss-pillar" />
        <canvas ref={fx} className="ss-fx" />
        <div className="ss-chant" aria-live="polite">
          {chant.slice(Math.max(0, lineIdx - 3), lineIdx + 1).map((l, i, arr) => {
            const cur = i === arr.length - 1 && stage === 'chant';
            const age = arr.length - 1 - i;
            return (
              <p key={lineIdx - age} className={cur ? 'cur' : ''} style={{ opacity: stage === 'chant' ? 1 - age * 0.28 : 0.15 }}>
                {cur ? l.slice(0, chars) : l}
                {cur && chars < l.length ? <span className="caret">▍</span> : null}
              </p>
            );
          })}
        </div>
        <div className="ss-flash" />
        {stage === 'chant' ? (
          <button
            className="ss-skip"
            onClick={(e) => {
              e.stopPropagation();
              setStage('ignite');
            }}
          >
            {T.skipChant}
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section className="screen s-summon summon-reveal">
      <div className="ss-rays" style={clsStyle(s.class)} />
      <div className="reveal">
        <div className="card summon-card" style={clsStyle(s.class)}>
          <Art className="art" src={s.images.summon} cls={s.class} />
          <span />
          <div>
            <div className="cls">{(LABELS.cls[s.class] ?? '').split('').join(' ')}</div>
            <div className="nm">{s.name_ko}</div>
          </div>
          <i className="shine" />
        </div>
        <div className="sheet">
          <div className="stagger" style={{ animationDelay: '0.9s' }}>
            <h3>{s.name_ko}</h3>
            <div className="sub">
              {LABELS.cls[s.class]} · {s.alignment_detail} · {plan.summon === 'random' ? T.summonRandomTag : T.summonCatalystTag}
            </div>
          </div>
          <dl className="stats stagger" style={{ animationDelay: '1.15s' }}>
            {STAT_IDS.map((k, i) => (
              <div key={k} className="stagger" style={{ animationDelay: `${1.25 + i * 0.08}s` }}>
                <dt>{T.stat[k]}</dt>
                <dd>
                  {s.ranks[k]}
                  <small>{parseRank(s.ranks[k]).value}</small>
                </dd>
              </div>
            ))}
          </dl>
          <div className="chips stagger" style={{ animationDelay: '1.8s' }}>
            {(session.data.skills[s.servant_id]?.skills ?? [])
              .filter((k) => k.kind !== 'noble_phantasm')
              .map((k) => (
                <span className="chip" key={k.skill_id}>
                  {k.name_ko} {k.rank ?? ''}
                </span>
              ))}
          </div>
          <div className="np stagger" style={{ animationDelay: '2s' }}>
            <RubyText text={`‘${s.noble_phantasm.name_ko}(${s.noble_phantasm.ruby_ko})’`} /> {s.noble_phantasm.rank}
            <small>{s.noble_phantasm.type_ko}</small>
          </div>
          {lineDone || (!line && !omen) ? (
            <div className="summon-next stagger" style={{ animationDelay: '0.1s' }}>
              <button className="btn primary" onClick={onStart}>
                {T.startWar}
              </button>
              <p>
                {T.seed} {plan.seed}
              </p>
            </div>
          ) : null}
        </div>
      </div>
      {(line || omen) && !lineDone ? (
        <DelayedVn
          delay={TIMING.line_delay_ms}
          lines={[
            ...(omen ? [{ kind: 'narration' as const, speaker: null, text: omen.text, draft: omen.status === 'draft' }] : []),
            ...(line ? [{ kind: 'line' as const, speaker: s.name_ko, text: line.text, draft: line.status === 'draft', voice: 'self' as const }] : []),
          ]}
          onDone={() => setLineDone(true)}
        />
      ) : null}
    </section>
  );
}

/** 카드가 다 나타난 뒤 (난입 소환 나레이션 →) 소환 대사. 한 줄씩 탭해서 넘긴다 */
function DelayedVn({ delay, lines, onDone }: { delay: number; lines: ShownLine[]; onDone: () => void }) {
  const [on, setOn] = useState(REDUCED);
  const [n, setN] = useState(1);
  useEffect(() => {
    const t = window.setTimeout(() => setOn(true), delay);
    return () => window.clearTimeout(t);
  }, [delay]);
  const next = useCallback(() => (n < lines.length ? setN(n + 1) : onDone()), [n, lines.length, onDone]);
  // 소환 대사는 탭해야 넘어간다 (자동 진행 끔)
  return on ? <Vn log={lines.slice(0, n)} typing onLineDone={next} onLog={() => undefined} autoDefault={false} /> : null;
}
