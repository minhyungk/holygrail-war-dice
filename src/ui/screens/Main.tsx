// S0_MAIN (prototype/mockup 메인 그대로 + 운명점 선택 D-095)
import { K } from '../../data/constants';
import { sealSrc } from '../components/common';
import { RubyText } from '../components/Ruby';
import { T } from '../strings';

export function Main({ quote, fatePoints, setFatePoints, onSummon }: {
  quote: { text: string; name: string; cls: string } | null;
  fatePoints: number;
  setFatePoints: (n: number) => void;
  onSummon: (mode: 'random' | 'catalyst') => void;
}) {
  const min = K['dice.fate_point_min'];
  const max = K['dice.fate_point_max'];
  const set = (n: number) => setFatePoints(Math.max(min, Math.min(max, n)));
  return (
    <section className="screen s-main">
      <div className="main-bg" style={{ backgroundImage: 'url("./assets/map/fuyuki_tile_night.jpeg")' }} />
      <div className="main-inner">
        <img className="main-seal" src={sealSrc(3)} alt="" />
        <h1 className="title">
          {T.title}
          <small>{T.subtitle}</small>
        </h1>
        {quote ? (
          <p className="main-quote">
            “<RubyText text={quote.text} />”<cite>{quote.name} · {quote.cls}</cite>
          </p>
        ) : null}
        <div className="stepper-wrap">
          <span className="main-stat">{T.fatePoints}</span>
          <div className="stepper">
            <button onClick={() => set(fatePoints - 1)} aria-label="운명점 줄이기" disabled={fatePoints <= min}>
              −
            </button>
            <b>{fatePoints}</b>
            <button onClick={() => set(fatePoints + 1)} aria-label="운명점 늘리기" disabled={fatePoints >= max}>
              +
            </button>
          </div>
        </div>
        <div className="main-actions">
          <button className="btn primary" onClick={() => onSummon('random')}>
            {T.summonRandom}
          </button>
          <button className="btn" onClick={() => onSummon('catalyst')}>
            {T.summonCatalyst}
          </button>
        </div>
        <div className="main-stat">{T.statsPending}</div>
      </div>
      <p className="copyright">{T.copyright}</p>
    </section>
  );
}
