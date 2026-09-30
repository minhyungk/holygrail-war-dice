// 맵 화면의 적 정보 카드 (D-166): 적 토큰이나 적 정보 목록을 누르면 지금까지 알아낸 단계만큼 보인다 (정보 가림, D-158).
import { STAT_IDS } from '../../data/schema';
import { INTEL } from '../../engine/intel';
import { parseRank } from '../../engine/stats';
import type { RunView } from '../../engine/view';
import { type Session, displayName } from '../session';
import { T } from '../strings';
import { Art, clsStyle, Glyph, LABELS } from './common';
import { RubyText } from './Ruby';

export function IntelCard({ fc, view, session, onClose }: { fc: string; view: RunView; session: Session; onClose: () => void }) {
  const f = view.factions[fc];
  if (!f) return null;
  const sv = session.data.servants[f.servant_id]!;
  const lv = view.intel[fc] ?? 0;
  const face = lv >= INTEL.face;
  const named = lv >= INTEL.name;
  const weak = lv >= INTEL.weakness;
  const master = face && f.master_id ? session.data.masters[f.master_id]?.name_ko : null;
  const skills = named ? (session.data.skills[sv.servant_id]?.skills ?? []).filter((k) => k.kind !== 'noble_phantasm') : [];
  const weakness = weak ? (sv.lore?.weakness ?? sv.lore?.detail ?? '') : '';
  return (
    <div className="modal" onClick={onClose}>
      <div className="box intel-card" style={clsStyle(face ? sv.class : null)} onClick={(e) => e.stopPropagation()}>
        <div className="ic-head">
          {face ? <Art src={sv.images.face} cls={sv.class} /> : <Glyph cls={sv.class} hidden />}
          <div>
            <h3>{displayName(view, session.data, fc, { unknown: LABELS.unknown, cls: LABELS.cls })}</h3>
            <div className="ic-sub">
              {face ? LABELS.cls[sv.class] : '?'}
              {named && sv.alignment_detail ? ` · ${sv.alignment_detail}` : ''}
              {master ? ` · ${T.intelCard.master} ${master}` : ''}
              {f.alive ? ` · ${T.condition[f.condition]}` : ` · ${T.intelCard.out}`}
            </div>
          </div>
          <span className={`ic-lv ${weak ? 'weak' : ''}`}>{`${lv}${T.intelCard.level} · ${T.intelLevel[lv]}`}</span>
        </div>
        {!face ? <p className="ic-none">{T.intelCard.none}</p> : null}
        {face ? (
          <dl className="stats">
            {STAT_IDS.map((k) => (
              <div key={k}>
                <dt>{T.stat[k]}</dt>
                <dd>
                  {sv.ranks[k]}
                  <small>{parseRank(sv.ranks[k]).value}</small>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        {named ? (
          <>
            <div className="np">
              <RubyText text={`‘${sv.noble_phantasm.name_ko}(${sv.noble_phantasm.ruby_ko})’`} /> {sv.noble_phantasm.rank}
              <small>{sv.noble_phantasm.type_ko}</small>
            </div>
            {skills.length ? (
              <div className="chips">
                {skills.map((k) => (
                  <span className="chip" key={k.skill_id}>
                    {k.name_ko} {k.rank ?? ''}
                  </span>
                ))}
              </div>
            ) : null}
          </>
        ) : face ? (
          <p className="ic-hint">{T.intelCard.nextName}</p>
        ) : null}
        {weak ? (
          <div className="ic-weak">
            <small>{T.intelCard.weakness}</small>
            {weakness.split('\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        ) : named ? (
          <p className="ic-hint">{T.intelCard.nextWeakness}</p>
        ) : null}
        <div className="row">
          <button className="btn" onClick={onClose}>
            {T.intelCard.close}
          </button>
        </div>
      </div>
    </div>
  );
}
