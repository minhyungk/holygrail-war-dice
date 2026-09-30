// D-157: cached Atlas skill data to deterministic, reviewable combat definitions.
import fs from 'node:fs';
import path from 'node:path';
import { foeTraitCondition, servantTraitIds } from './lib/atlas-profile.mjs';

const root = path.resolve(import.meta.dirname, '..');
const atlas = '/private/tmp/claude-501/-Users-michaelkwon-Desktop-fsn6-docs/0c18cccd-6b29-4e5c-a70a-83953400345f/scratchpad/atlas';
const traitAtlas = process.argv.includes('--atlas') ? process.argv[process.argv.indexOf('--atlas') + 1] : path.join(atlas, 'KR');
const servantTraits = servantTraitIds(traitAtlas);
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const normalize = (name) => name.replace(/\s+/g, '');
const splitRank = (name) => {
  const parts = name.trim().split(/\s+/);
  const tail = parts.at(-1);
  return parts.length > 1 && /^(?:EX|[A-E])[+\-]*$|^-$/.test(tail)
    ? { name: parts.slice(0, -1).join(' '), rank: tail }
    : { name: name.trim(), rank: null };
};
const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const source = (locale, id) => read(path.join(locale === 'KR' ? traitAtlas : path.join(atlas, locale), `${id}.json`));
const roster = read(path.join(root, 'data/servants-pool/activation/roster.json')).servants;
const existingDirs = fs.readdirSync(path.join(root, 'data/servants')).filter((dir) => {
  const file = path.join(root, 'data/servants', dir, 'skills.json');
  return fs.existsSync(file) && !read(file).notes?.startsWith('Atlas KR 자동 생성 (D-157,');
});
const existingFamilies = new Map();
for (const dir of existingDirs) {
  const file = path.join(root, 'data/servants', dir, 'skills.json');
  if (!fs.existsSync(file)) continue;
  for (const link of read(file).skills) {
    if (link.origin !== 'np') existingFamilies.set(normalize(link.name_ko), link.skill_id);
  }
}
const commonPath = path.join(root, 'data/common/skills.json');
const commonRaw = fs.readFileSync(commonPath, 'utf8');
const original = read(commonPath).skills.filter((item) => !item.notes?.startsWith('자동 배정 (D-157):'));
const originalIds = new Set(original.map((item) => item.skill_id));
const definitions = new Map(original.map((item) => [item.skill_id, item]));
const familyIds = new Map(existingFamilies);
const idOwners = new Map([...existingFamilies].map(([family, id]) => [id, family]));
const created = [];
const reports = [];
const ruleCounts = Object.fromEntries(['R0', ...Array.from({ length: 12 }, (_, i) => `R${i + 1}`)].map((r) => [r, 0]));

function finalPersonal(skills) {
  const byNum = new Map();
  for (const skill of skills ?? []) {
    if (!byNum.has(skill.num) || skill.id > byNum.get(skill.num).id) byNum.set(skill.num, skill);
  }
  return [...byNum.entries()].sort(([a], [b]) => a - b).map(([, skill]) => skill);
}

function classify(skill, isClass) {
  const functions = skill.functions ?? [];
  const buffs = functions.flatMap((fn) => (fn.buffs ?? []).map((buff) => ({ fn, buff })));
  const summary = [...new Set([
    ...functions.map((fn) => `func:${fn.funcType}`),
    ...buffs.map(({ buff }) => `buff:${buff.type}`),
  ])].join(', ') || 'functions/buffs 없음';
  if (isClass) return { rule: 'R0', summary, reason: '클래스 스킬은 기존 계열만 효과' };
  const ally = (fn) => !/enemy/i.test(fn.funcTargetType ?? '');
  const enemy = (fn) => /enemy/i.test(fn.funcTargetType ?? '');
  const hasBuff = (types, check = ally) => buffs.some(({ fn, buff }) => check(fn) && types.includes(buff.type));
  const hasFunc = (types, check = ally) => functions.some((fn) => check(fn) && types.includes(fn.funcType));
  const roll = (rule, when, target = 'self', scaling = 'major') => {
    const traits = target === 'self' ? foeTraitCondition(skill, servantTraits) : [];
    return { rule, summary, hook: 'hk_battle_phase_roll', when: traits.length ? { ...when, foe_trait: traits } : when, effect: target === 'foe' ? { type: 'roll_mod', target, sign: -1 } : { type: 'roll_mod', target }, scaling };
  };
  if (hasBuff(['guts']) || hasFunc(['gutsFunction'])) return { rule: 'R1', summary, hook: 'hk_battle_condition_change', when: { would_fall: true }, effect: { type: 'condition_guard', target: 'self' }, scaling: 'none', uses_per_battle: 1 };
  if (hasBuff(['invincible', 'avoidance'])) return roll('R2', { phase: ['ph_initiative', 'ph_fate'], role: 'defender' });
  if (hasBuff(['upNpdamage'])) return roll('R4', { phase: ['ph_np_clash', 'ph_np_attack'] });
  const cardBuffs = buffs.filter(({ fn, buff }) => ally(fn) && buff.type === 'upCommandall');
  if (cardBuffs.length) {
    const cardIds = new Set(cardBuffs.flatMap(({ buff }) => ['ckSelfIndv', 'ckOpIndv', 'tvals', 'vals'].flatMap((field) => (buff[field] ?? []).map((x) => x.id))).filter((id) => [4001, 4002, 4003].includes(id)));
    const phases = cardIds.size === 1 ? { 4001: ['ph_sorcery'], 4002: ['ph_clash'], 4003: ['ph_initiative'] }[[...cardIds][0]] : ['ph_clash', 'ph_initiative', 'ph_sorcery'];
    return roll('R5', { phase: phases });
  }
  if (hasBuff(['upAtk', 'upDamage', 'upDamageIndividuality', 'upDamageIndividualityActiveonly', 'upCriticaldamage', 'pierceInvincible', 'breakAvoidance', 'addDamage'])) return roll('R6', { phase: ['ph_clash'] });
  // R3(마력)은 판정 버프(R4~R6)보다 뒤: 버스터 업 + NP 획득 같은 복합 스킬은 판정 보정으로 본다 (D-157 검토)
  if (hasFunc(['gainNp']) || hasFunc(['gainNpFromTargets'], () => true) || hasFunc(['hastenNpturn']) || hasBuff(['regainNp', 'upChagetd'])) return { rule: 'R3', summary, hook: 'hk_battle_phase_select', when: { phase_index: 1 }, effect: { type: 'resource_change', target: 'self', resource: 'mana' }, scaling: 'mana' };
  if (hasBuff(['donotAct', 'donotNoble', 'donotSkill'], enemy)) return roll('R7', { phase: ['ph_initiative'], role: 'attacker' }, 'foe');
  if (hasBuff(['downDefence', 'downAtk', 'downCriticalrate', 'downTolerance', 'downNpdamage', 'downDefencecommandall'], enemy)) return roll('R8', {}, 'foe', 'minor');
  if (hasBuff(['upDefence', 'subSelfdamage', 'upHate'])) return roll('R9', { role: 'defender' }, 'self', 'minor');
  if (hasBuff(['upGrantstate', 'upNonresistInstantdeath', 'upGrantInstantdeath'])) return roll('R10', { phase: ['ph_fate'], role: 'attacker' });
  if (hasBuff(['upCriticalrate', 'upCriticalpoint', 'upStarweight', 'regainStar']) || hasFunc(['gainStar'])) return roll('R11', { phase: ['ph_fate'] }, 'self', 'minor');
  if (hasFunc(['gainHp', 'subState']) || hasBuff(['regainHp', 'upTolerance', 'avoidState', 'addMaxhp'])) return roll('R12', { self_condition: ['hurt', 'danger'] }, 'self', 'minor');
  return { rule: 'R0', summary, reason: '규칙표와 일치하는 아군/적 대상 효과 없음' };
}

function makeId(family, english, atlasId) {
  const key = normalize(family);
  if (familyIds.has(key)) return familyIds.get(key);
  const base = `sk_${slug(english) || `a${atlasId}`}`;
  let id = base;
  for (let suffix = 2; idOwners.has(id) || originalIds.has(id); suffix++) id = `${base}_${suffix}`;
  familyIds.set(key, id);
  idOwners.set(id, key);
  return id;
}

for (const servant of roster) {
  if (existingDirs.includes(servant.servant_id)) continue;
  const kr = source('KR', servant.source_id);
  const na = source('NA', servant.source_id);
  const english = new Map([...na.skills ?? [], ...na.classPassive ?? []].map((skill) => [skill.id, splitRank(skill.name).name]));
  const links = [];
  for (const [kind, skills] of [['class', kr.classPassive ?? []], ['personal', finalPersonal(kr.skills)]]) {
    for (const skill of skills) {
      const { name, rank } = splitRank(skill.name);
      const key = normalize(name);
      const reused = existingFamilies.has(key);
      const id = makeId(name, english.get(skill.id) ?? '', skill.id);
      links.push({ skill_id: id, name_ko: name, rank, kind: reused ? 'generic' : 'unique', origin: kind });
      if (!definitions.has(id)) {
        const rule = classify(skill, kind === 'class');
        const note = rule.rule === 'R0' ? `자동 배정 (D-157): ${rule.reason} — ${rule.summary}` : `자동 배정 (D-157): 규칙 ${rule.rule} — ${rule.summary}`;
        const { rule: _rule, summary: _summary, reason: _reason, ...fields } = rule;
        const def = { skill_id: id, ...('hook' in fields ? fields : { hook: null }), notes: note };
        definitions.set(id, def);
        created.push({ id, name, rule: rule.rule, summary: rule.summary });
        ruleCounts[rule.rule]++;
      }
    }
  }
  const active = links.filter((link) => definitions.get(link.skill_id)?.hook !== null).length;
  reports.push({ servant_id: servant.servant_id, active, total: links.length });
  const file = path.join(root, 'data/servants', servant.servant_id, 'skills.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({ servant_id: servant.servant_id, skills: links, notes: 'Atlas KR 자동 생성 (D-157, scripts/activate-skills.mjs). 효과는 규칙표 자동 배정 [임시값]' }, null, 2)}\n`);
}

// Retain every original definition line byte for byte, including its formatting.
const lines = commonRaw.split('\n');
const generatedAt = lines.findIndex((line) => line.includes('자동 배정 (D-157):'));
const prefix = generatedAt < 0 ? lines.slice(0, lines.findIndex((line) => line.trim() === ']')) : lines.slice(0, generatedAt);
while (prefix.at(-1)?.trim() === '') prefix.pop();
prefix[prefix.length - 1] = prefix.at(-1).replace(/,$/, '');
const additions = created.map(({ id }) => `    ${JSON.stringify(definitions.get(id))}`);
const lastOriginal = prefix.at(-1);
if (additions.length) prefix[prefix.length - 1] = `${lastOriginal},`;
fs.writeFileSync(commonPath, `${prefix.join('\n')}${additions.length ? `\n${additions.join(',\n')}` : ''}\n  ]\n}\n`);

const report = [
  '# 신규 93기 스킬 자동 배정 (D-157)', '',
  `신규 서번트 ${reports.length}기, 새 계열 ${created.length}개. 규칙 수는 새 정의 기준.`, '',
  '## 규칙별 개수', '',
  '| 규칙 | 개수 |', '|---|---:|',
  ...Object.entries(ruleCounts).map(([rule, count]) => `| ${rule} | ${count} |`), '',
  '## R0 계열', '',
  ...created.filter((item) => item.rule === 'R0').map((item) => `- ${item.name} (${item.id}): ${item.summary}`), '',
  '## 새 skill_id', '',
  '| KR 계열명 | skill_id | 규칙 |', '|---|---|---|',
  ...created.map((item) => `| ${item.name.replaceAll('|', '\\|')} | ${item.id} | ${item.rule} |`), '',
  '## 서번트별 발동 가능 스킬', '',
  '| 서번트 ID | 발동 가능 / 전체 |', '|---|---:|',
  ...reports.map((item) => `| ${item.servant_id} | ${item.active} / ${item.total} |`), '',
];
fs.writeFileSync(path.join(root, 'data/servants-pool/activation/skill-report.md'), report.join('\n'));
console.log(`D-157: ${reports.length} servants, ${created.length} definitions`);
