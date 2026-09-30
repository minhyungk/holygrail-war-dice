import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { atlasFiles, extractProfile, finalPersonal, foeTraitCondition, instantDeathSources, readAtlas, servantTraitIds, targetNp, traitNames } from './lib/atlas-profile.mjs';

const flag = process.argv.indexOf('--atlas');
if (flag < 0 || !process.argv[flag + 1]) throw new Error('사용법: node scripts/enrich-profiles.mjs --atlas <캐시 경로>');
const atlasDir = resolve(process.argv[flag + 1]);
const root = resolve(import.meta.dirname, '..');
const servantsDir = join(root, 'data/servants');
const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
const write = (file, data) => writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
const traits = servantTraitIds(atlasDir);
const names = traitNames(atlasDir);
const rows = [];
const links = new Map();
const splitRank = (name) => {
  const parts = name.trim().split(/\s+/);
  const tail = parts.at(-1);
  return parts.length > 1 && /^(?:EX|[A-E])[+\-]*$|^-$/.test(tail)
    ? { name: parts.slice(0, -1).join(' '), rank: tail } : { name: name.trim(), rank: null };
};
const labelIds = (ids) => ids.map((id) => `${id} (${names.get(id) ?? '?'})`).join(', ');

for (const dir of readdirSync(servantsDir).sort()) {
  const profileFile = join(servantsDir, dir, 'profile.json');
  if (!existsSync(profileFile)) continue;
  const profile = read(profileFile);
  const atlas = readAtlas(atlasDir, profile.source_id);
  const extracted = extractProfile(atlas, profile, traits);
  const np = targetNp(atlas, profile);
  profile.traits = extracted.traits;
  if (extracted.lore) profile.lore = extracted.lore;
  else delete profile.lore;
  profile.noble_phantasm.special_attack = extracted.special_attack;
  profile.instant_death = extracted.instant_death;
  write(profileFile, profile);
  rows.push({ id: profile.servant_id, sourceId: profile.source_id, detail: extracted.lore?.detail, special: extracted.special_attack, death: instantDeathSources(atlas, np) });

  const skillsFile = join(servantsDir, dir, 'skills.json');
  if (!existsSync(skillsFile)) continue;
  const pool = [...(atlas.classPassive ?? []), ...finalPersonal(atlas.skills)];
  for (const link of read(skillsFile).skills ?? []) {
    if (link.origin === 'np') continue;
    const candidates = pool.filter((skill) => {
      const parsed = splitRank(skill.name);
      return parsed.name === link.name_ko && parsed.rank === link.rank;
    });
    const resolved = candidates.length === 1 ? candidates[0] : null;
    const list = links.get(link.skill_id) ?? [];
    list.push({ servant: profile.servant_id, link, skill: resolved, candidates: candidates.length });
    links.set(link.skill_id, list);
  }
}

const damage = new Map();
for (const file of atlasFiles(atlasDir)) {
  const atlas = readAtlas(atlasDir, file.slice(0, -5));
  for (const np of atlas.noblePhantasms ?? []) for (const fn of np.functions ?? []) {
    if (!fn.funcType?.startsWith('damageNp')) continue;
    const record = damage.get(fn.funcType) ?? { count: 0, keys: new Set() };
    record.count++;
    for (const vals of fn.svals ?? []) for (const key of Object.keys(vals)) record.keys.add(key);
    damage.set(fn.funcType, record);
  }
}

const commonFile = join(root, 'data/common/skills.json');
const original = readFileSync(commonFile, 'utf8');
const changedR7 = [], changedFoe = [], conflicts = [], manual = [], unresolved = [];
const updated = original.split('\n').map((line) => {
  if (!line.includes('"skill_id"')) return line;
  let def;
  try { def = JSON.parse(line.trim().replace(/,$/, '')); } catch { return line; }
  const family = links.get(def.skill_id) ?? [];
  if (!def.notes?.startsWith('자동 배정 (D-157):')) {
    if (def.effect?.type === 'roll_mod' && def.effect.target === 'self') {
      const candidates = family.filter(({ skill }) => skill && foeTraitCondition(skill, traits).length);
      if (candidates.length) manual.push({ id: def.skill_id, members: candidates });
    }
    return line;
  }
  let changed = false;
  if (def.notes.startsWith('자동 배정 (D-157): 규칙 R7')) {
    changedR7.push(def.skill_id);
    if (JSON.stringify(def.when) !== JSON.stringify({ phase: ['ph_initiative'], role: 'attacker' })) {
      def.when = { phase: ['ph_initiative'], role: 'attacker' };
      changed = true;
    }
  }
  if (def.effect?.type === 'roll_mod' && def.effect.target === 'self' && family.length) {
    const results = family.map(({ skill, candidates }) => skill && candidates === 1 ? foeTraitCondition(skill, traits) : null);
    if (results.some((result) => result === null)) unresolved.push(def.skill_id);
    else {
      const signatures = new Set(results.map((result) => JSON.stringify(result)));
      if (signatures.size > 1) conflicts.push({ id: def.skill_id, family, results });
      else if (results[0]?.length) {
        def.when = { ...def.when, foe_trait: results[0] };
        changedFoe.push({ id: def.skill_id, traits: results[0], source: family[0].skill.name });
        changed = true;
      }
    }
  }
  return changed ? `${line.match(/^\s*/)[0]}${JSON.stringify(def)}${line.trimEnd().endsWith(',') ? ',' : ''}` : line;
}).join('\n');
if (updated !== original) writeFileSync(commonFile, updated);

const decision = {
  damageNp: '제외: 특성 조건 없음', damageNpPierce: '제외: 특성 조건 없음',
  damageNpIndividual: '채택: Target는 상대 서번트 특성',
  damageNpIndividualSum: '채택: TargetList의 서번트 특성만',
  damageNpAndOrCheckIndividuality: '채택: And/OrCheckIndividualityList의 서번트 특성만',
  damageNpStateIndividualFix: '제외: 상태 특성 대상', damageNpHpratioLow: '제외: HP 비율 대상',
  damageNpRare: '제외: 희귀도 대상',
};
const report = [
  '# Atlas 프로필·스킬 보강 보고서', '',
  `캐시 ${atlasFiles(atlasDir).length}기, 프로필 ${rows.length}기.`, '',
  '## damageNp 계열 조사', '',
  '| funcType | 함수 수 | svals 키 | 처리 |', '|---|---:|---|---|',
  ...[...damage].sort(([a], [b]) => a.localeCompare(b)).map(([type, item]) => `| ${type} | ${item.count} | ${[...item.keys].join(', ')} | ${decision[type] ?? '제외: 대상 의미 미확인'} |`), '',
  '## 즉사 서번트', '',
  '| servant_id | 근거 |', '|---|---|',
  ...rows.filter((row) => row.death.length).map((row) => `| ${row.id} | ${row.death.map((item) => `${item.kind}: ${item.name}`).join('; ')} |`), '',
  '## 보구 특공 서번트', '',
  '| servant_id | 대상 특성 |', '|---|---|',
  ...rows.filter((row) => row.special.length).map((row) => `| ${row.id} | ${labelIds(row.special)} |`), '',
  '## foe_trait 추가 정의', '',
  '| skill_id | 대상 특성 | 근거 Atlas 스킬 |', '|---|---|---|',
  ...changedFoe.map((row) => `| ${row.id} | ${labelIds(row.traits)} | ${row.source} |`), '',
  '## 계열 충돌로 보류', '',
  ...(conflicts.length ? conflicts.map(({ id, family, results }) => `- ${id}: ${family.map((member, index) => `${member.servant} / ${member.skill?.name ?? '미일치'} → ${labelIds(results[index] ?? []) || '조건 없음'}`).join('; ')}`) : ['- 없음']), '',
  '## 수기 정의 후보 (미수정)', '',
  ...(manual.length ? manual.map(({ id, members }) => `- ${id}: ${members.map(({ servant, skill }) => `${servant} / ${skill.name} → ${labelIds(foeTraitCondition(skill, traits))}`).join('; ')}`) : ['- 없음']), '',
  '## Atlas 스킬 링크 미해결 (미수정)', '',
  ...(unresolved.length ? unresolved.map((id) => `- ${id}`) : ['- 없음']), '',
  '## R7 변경 정의', '',
  ...(changedR7.length ? changedR7.map((id) => `- ${id}`) : ['- 없음']), '',
  '문서 대조: `docs/systems/skills.md` §14의 R7 설명은 아직 즉사/우연 국면을 포함한다. 이번 데이터와 스크립트는 사용자 결정대로 선제/회피 국면만 사용한다. 문서는 수정 금지 범위에 있어 유지했다.', '',
  '## lore 없는 서번트', '',
  ...(rows.some((row) => !row.detail) ? rows.filter((row) => !row.detail).map((row) => `- ${row.id}`) : ['- 없음']), '',
  '## 지정 사례', '',
  `- 쿠 훌린 (source_id 17) instant_death: ${rows.find((row) => row.sourceId === 17)?.death.length > 0}`,
  `- 지크프리트 (sv_0006_siegfried) 용 특성 2002: ${rows.find((row) => row.id === 'sv_0006_siegfried')?.special.includes(2002)}`, '',
];
writeFileSync(join(root, 'data/servants-pool/activation/profile-enrich-report.md'), report.join('\n'));
console.log(`프로필 ${rows.length}기, 특공 ${rows.filter((row) => row.special.length).length}기, 즉사 ${rows.filter((row) => row.death.length).length}기, foe_trait ${changedFoe.length}개, R7 ${changedR7.length}개`);
