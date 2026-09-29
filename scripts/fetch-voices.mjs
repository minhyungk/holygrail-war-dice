/**
 * Atlas Academy(KR)에서 FGO 보이스 대사를 가져와 서번트 dialogue.json에 합친다 (D-151, D-143 범용층).
 * - 서번트 폴더의 profile.json `source_id`(FGO 번호)로 조회한다. 음성 파일은 받지 않는다.
 * - 이미 있는 id는 건드리지 않는다 (검수한 줄 보호). 새 줄만 status draft, source fgo로 추가한다.
 * - 칼데아·인리 등 FGO 본편 맥락이 필요한 줄은 뺀다 (성배전쟁 무대에 맞지 않음).
 *
 * 실행: node scripts/fetch-voices.mjs [servant_id ...]   (인자가 없으면 data/servants 전부)
 *       --dry  : 파일을 쓰지 않고 추가될 줄 수만 출력
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const API = 'https://api.atlasacademy.io/nice/KR/servant';
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const ids = args.filter((a) => !a.startsWith('--'));

/** FGO 본편 맥락 (이 게임의 무대에서 어색한 줄) */
const OFF_CONTEXT = /인리|칼데아|인류|세계를 구|특이점|레이시프트|이벤트|영기재림|레벨|QP|소재|수확|마이 ?룸|카르데아|다빈치|마슈|로마니|성배 ?탐색|파티/;

const clean = (t) => (t ?? '').replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
const lineText = (vl) => clean(vl.subtitle || (vl.text && vl.text.join(' ')) || '');

/** 보이스 그룹 → 태그별 줄 */
function extract(voices) {
  const out = { phase_win: [], phase_hit: [], skill: [], day_bond: [] };
  for (const vg of voices) {
    if (vg.voicePrefix && vg.voicePrefix !== 0) continue; // 1재림 기준
    for (const vl of vg.voiceLines) {
      const name = vl.name ?? '';
      const text = lineText(vl);
      if (!text || OFF_CONTEXT.test(text)) continue;
      if (vg.type === 'battle') {
        let m;
        if ((m = /^공격 (\d+)$/.exec(name))) out.phase_win.push({ id: `fgo_atk_${m[1]}`, text });
        else if (/^엑스트라 공격/.test(name)) out.phase_win.push({ id: `fgo_ex_${out.phase_win.filter((l) => l.id.startsWith('fgo_ex')).length + 1}`, text });
        else if ((m = /^대미지 (\d+)$/.exec(name))) out.phase_hit.push({ id: `fgo_dmg_${m[1]}`, text });
        else if ((m = /^스킬 (\d+)$/.exec(name))) out.skill.push({ id: `fgo_skill_${m[1]}`, text });
      } else if (vg.type === 'home') {
        let m;
        // 인연 대사는 호감도 단계에 맞춰 나온다: Lv.1~2 중립 이상, Lv.3 호감 이상, Lv.4~5 충성 (affinity.md §3.2)
        if ((m = /^인연 Lv\.(\d)$/.exec(name))) {
          const lv = Number(m[1]);
          const tier = lv <= 2 ? { in: ['neutral', 'friendly', 'loyal'] } : lv === 3 ? { in: ['friendly', 'loyal'] } : 'loyal';
          out.day_bond.push({ id: `fgo_bond_${lv}`, when: { 'self.affinity_tier': tier }, text, weight: 2, repeat: 'once_per_run', tone: lv >= 4 ? 'tender' : 'calm' });
        } else if (name === '좋아하는 것') out.day_bond.push({ id: 'fgo_like', text, repeat: 'once_per_run' });
        else if (name === '싫어하는 것') out.day_bond.push({ id: 'fgo_dislike', text, repeat: 'once_per_run' });
        else if (name === '성배에 대하여') out.day_bond.push({ id: 'fgo_grail', when: { 'world.day': { gte: 3 } }, text, weight: 2, repeat: 'once_per_run', tone: 'calm' });
      }
    }
  }
  return out;
}

const dirs = ids.length ? ids : readdirSync(join(ROOT, 'data/servants')).sort();
for (const id of dirs) {
  const dir = join(ROOT, 'data/servants', id);
  const profile = JSON.parse(readFileSync(join(dir, 'profile.json'), 'utf-8'));
  const res = await fetch(`${API}/${profile.source_id}?lore=true`);
  if (!res.ok) {
    console.error(`${id}: Atlas ${res.status}`);
    continue;
  }
  const nice = await res.json();
  const got = extract(nice.profile?.voices ?? []);
  const path = join(dir, 'dialogue.json');
  const file = JSON.parse(readFileSync(path, 'utf-8'));
  let added = 0;
  for (const [tag, lines] of Object.entries(got)) {
    const list = (file.tags[tag] ??= []);
    for (const l of lines) {
      if (list.some((x) => x.id === l.id)) continue;
      list.push({ ...l, source: 'fgo', quote_of: 'Fate/Grand Order', quote_verified: true });
      added += 1;
    }
    if (!list.length) delete file.tags[tag];
  }
  console.log(`${id}: +${added}`);
  if (!dry && added) writeFileSync(path, JSON.stringify(file, null, 2) + '\n');
}
