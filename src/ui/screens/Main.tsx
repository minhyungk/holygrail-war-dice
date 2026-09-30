// S0_MAIN: 일곱 자리와 소환 전 실루엣 (D-166). 소환 연출은 소환 화면 영창이 맡는다 (D-169).
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { K } from '../../data/constants';
import { STANDARD_CLASSES, type ServantProfile } from '../../data/schema';
import { createRng } from '../../engine/rng';
import { clsStyle, Glyph, sealSrc } from '../components/common';
import { RubyText } from '../components/Ruby';
import { drawCircle, REDUCED } from '../fx/circle';
import { newSeed } from '../session';
import { T } from '../strings';
import '../main.css';

const FX = K['text.main_fx'];

export function Main({ servants, fatePoints, setFatePoints, onSummon }: {
  servants: ServantProfile[];
  fatePoints: number;
  setFatePoints: (n: number) => void;
  onSummon: (mode: 'random' | 'catalyst') => void;
}) {
  const [lit, setLit] = useState(REDUCED ? STANDARD_CLASSES.length : 0);
  const [art, setArt] = useState<{ current: ServantProfile | null; incoming: ServantProfile | null }>({ current: null, incoming: null });
  const [failed, setFailed] = useState<Set<string>>(() => new Set());
  const exitingRef = useRef(false);
  const circle = useRef<HTMLCanvasElement>(null);
  const min = K['dice.fate_point_min'];
  const max = K['dice.fate_point_max'];
  const set = (n: number) => setFatePoints(Math.max(min, Math.min(max, n)));

  // 일곱 자리 점등 뒤 마법진을 한 바퀴 돌린다 (D-166).
  useEffect(() => {
    const canvas = circle.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    drawCircle(ctx, canvas.width, 0, REDUCED ? 0.25 : 0.12);
    if (REDUCED) return;
    let count = 0;
    let raf = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setLit(count);
      if (count !== STANDARD_CLASSES.length) return;
      window.clearInterval(timer);
      const start = performance.now();
      const frame = (now: number) => {
        const progress = Math.min(1, (now - start) / FX.circle_spin_ms);
        const glow = 0.25 + 0.75 * Math.sin(Math.PI * progress);
        drawCircle(ctx, canvas.width, progress * Math.PI * 2, glow);
        if (progress < 1) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }, FX.class_light_ms);
    return () => {
      window.clearInterval(timer);
      cancelAnimationFrame(raf);
    };
  }, []);

  // 한 장을 보여주는 동안 다음 한 장만 미리 받는다 (D-166).
  useEffect(() => {
    const pool = servants.filter((s) => s.images.summon && !failed.has(s.servant_id));
    if (!pool.length) {
      setArt({ current: null, incoming: null });
      return;
    }
    const rng = createRng(newSeed());
    const bad = new Set<string>();
    let stopped = false;
    let holdTimer = 0;
    let fadeTimer = 0;
    let loading: HTMLImageElement | null = null;

    const pick = (previous: ServantProfile | null): ServantProfile | null => {
      const start = rng.int(0, pool.length - 1);
      for (let offset = 0; offset < pool.length; offset++) {
        const candidate = pool[(start + offset) % pool.length]!;
        if (!bad.has(candidate.servant_id) && (pool.length === 1 || candidate.servant_id !== previous?.servant_id)) return candidate;
      }
      return null;
    };

    const preload = (previous: ServantProfile | null, ready: (next: ServantProfile) => void) => {
      const candidate = pick(previous);
      if (!candidate || stopped) return;
      const img = new Image();
      loading = img;
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        if (!stopped) ready(candidate);
      };
      img.onerror = () => {
        bad.add(candidate.servant_id);
        if (!stopped) preload(previous, ready);
      };
      img.src = candidate.images.summon;
    };

    const show = (current: ServantProfile) => {
      if (stopped) return;
      setArt({ current, incoming: null });
      if (REDUCED || pool.length === 1) return;
      let next: ServantProfile | null = null;
      let elapsed = false;
      const begin = () => {
        if (!elapsed || !next || stopped) return;
        const incoming = next;
        setArt({ current, incoming });
        fadeTimer = window.setTimeout(() => show(incoming), FX.crossfade_ms);
      };
      preload(current, (loaded) => {
        next = loaded;
        begin();
      });
      holdTimer = window.setTimeout(() => {
        elapsed = true;
        begin();
      }, FX.silhouette_ms);
    };

    preload(null, show);
    return () => {
      stopped = true;
      window.clearTimeout(holdTimer);
      window.clearTimeout(fadeTimer);
      if (loading) {
        loading.onload = null;
        loading.onerror = null;
      }
    };
  }, [servants, failed]);


  const imageFailed = (id: string) => setFailed((prev) => new Set(prev).add(id));
  // 소환 연출은 소환 화면의 영창(「고한다」)이 맡는다: 누르면 바로 넘어간다 (D-169)
  const summon = (mode: 'random' | 'catalyst') => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    onSummon(mode);
  };

  const style = {
    '--main-silhouette-ms': `${FX.silhouette_ms}ms`,
    '--main-crossfade-ms': `${FX.crossfade_ms}ms`,
    '--main-class-ms': `${FX.class_light_ms}ms`,
    '--main-circle-spin-ms': `${FX.circle_spin_ms}ms`,
  } as CSSProperties;

  return (
    <section className="screen s-main" style={style}>
      <div className="main-bg" style={{ backgroundImage: 'url("./assets/map/fuyuki_tile_night.jpeg")' }} />
      <div className="main-mist" />
      <div className="main-embers" aria-hidden="true">
        {Array.from({ length: STANDARD_CLASSES.length }, (_, i) => <i key={i} />)}
      </div>
      <div className="main-figures" aria-hidden="true">
        {art.current && <img className="main-figure" src={art.current.images.summon} alt="" referrerPolicy="no-referrer" onError={() => imageFailed(art.current!.servant_id)} />}
        {art.incoming && <img className="main-figure main-figure-in" src={art.incoming.images.summon} alt="" referrerPolicy="no-referrer" onError={() => imageFailed(art.incoming!.servant_id)} />}
      </div>
      <div className="main-inner">
        <div className="main-ring" aria-hidden="true">
          <canvas ref={circle} className="main-circle" width={680} height={680} />
          <img className="main-seal" src={sealSrc(3)} alt="" />
          {STANDARD_CLASSES.map((cls, i) => {
            const angle = -Math.PI / 2 + i * 2 * Math.PI / STANDARD_CLASSES.length;
            const position = { ...clsStyle(cls), left: `${50 + Math.cos(angle) * 42}%`, top: `${50 + Math.sin(angle) * 42}%` };
            return <span key={cls} className={`main-class ${i < lit ? 'lit' : ''}`} style={position}><Glyph cls={cls} /></span>;
          })}
        </div>
        <h1 className="title">{T.title}<small>{T.subtitle}</small></h1>
        <p className={`main-tagline ${lit >= STANDARD_CLASSES.length ? 'in' : ''}`}><RubyText text={T.mainTagline} /></p>
        <div className="main-actions">
          <button className="btn primary" onClick={() => summon('random')}>{T.summonRandom}</button>
          <button className="btn" onClick={() => summon('catalyst')}>{T.summonCatalyst}</button>
        </div>
        <div className="stepper-wrap">
          <span className="main-stat">{T.fatePoints}</span>
          <div className="stepper">
            <button onClick={() => set(fatePoints - 1)} aria-label="운명점 줄이기" disabled={fatePoints <= min}>−</button>
            <b>{fatePoints}</b>
            <button onClick={() => set(fatePoints + 1)} aria-label="운명점 늘리기" disabled={fatePoints >= max}>+</button>
          </div>
        </div>
        <div className="main-stat">{T.statsPending}</div>
      </div>
      <p className="copyright">{T.copyright}</p>
    </section>
  );
}
