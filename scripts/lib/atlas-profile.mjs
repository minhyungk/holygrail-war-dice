import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const atlasFiles = (atlasDir) => readdirSync(atlasDir).filter((name) => /^\d+\.json$/.test(name));
export const readAtlas = (atlasDir, sourceId) => JSON.parse(readFileSync(join(atlasDir, `${sourceId}.json`), 'utf8'));
export const traitIds = (atlas) => [...new Set((atlas.traits ?? []).map((trait) => trait.id).filter(Number.isInteger))].sort((a, b) => a - b);
export const servantTraitIds = (atlasDir) => {
  const ids = new Set();
  for (const file of atlasFiles(atlasDir)) for (const id of traitIds(readAtlas(atlasDir, file.slice(0, -5)))) ids.add(id);
  return ids;
};
export const traitNames = (atlasDir) => {
  const names = new Map();
  for (const file of atlasFiles(atlasDir)) for (const trait of readAtlas(atlasDir, file.slice(0, -5)).traits ?? []) names.set(trait.id, trait.name);
  return names;
};

export function loreDetail(atlas) {
  const comments = atlas.profile?.comments ?? [];
  const selected = comments.find((comment) => comment.id === 1)
    ?? comments.filter((comment) => comment.condType === 'none').sort((a, b) => a.priority - b.priority)[0];
  if (!selected?.comment?.trim()) return undefined;
  return selected.comment.trim().split(/\n\s*\n/).map((paragraph) => paragraph.replace(/\s+/g, ' ').trim()).join('\n');
}

export function targetNp(atlas, profile) {
  const nps = atlas.noblePhantasms ?? [];
  const matching = nps.filter((np) => np.name === profile.noble_phantasm.name_ko);
  return (matching.length ? matching : nps).reduce((latest, np) => !latest || np.id > latest.id ? np : latest, null);
}

export function specialAttack(np, servantTraits) {
  const ids = [];
  for (const fn of np?.functions ?? []) {
    if (!/enemy/i.test(fn.funcTargetType ?? '')) continue;
    for (const vals of fn.svals ?? []) {
      if (fn.funcType === 'damageNpIndividual') ids.push(vals.Target);
      if (fn.funcType === 'damageNpIndividualSum') ids.push(...(vals.TargetList ?? []));
      if (fn.funcType === 'damageNpAndOrCheckIndividuality') ids.push(...(vals.AndCheckIndividualityList ?? []), ...(vals.OrCheckIndividualityList ?? []));
    }
  }
  return [...new Set(ids.filter((id) => Number.isInteger(id) && servantTraits.has(id)))].sort((a, b) => a - b);
}

export function finalPersonal(skills) {
  const byNum = new Map();
  for (const skill of skills ?? []) if (!byNum.has(skill.num) || skill.id > byNum.get(skill.num).id) byNum.set(skill.num, skill);
  return [...byNum.entries()].sort(([a], [b]) => a - b).map(([, skill]) => skill);
}

export function instantDeathSources(atlas, np) {
  return [np, ...finalPersonal(atlas.skills)].filter(Boolean).filter((skill) =>
    (skill.functions ?? []).some((fn) => /enemy/i.test(fn.funcTargetType ?? '') && ['instantDeath', 'forceInstantDeath'].includes(fn.funcType))
  ).map((skill) => ({ kind: skill === np ? '보구' : '스킬', name: skill.name }));
}

export function extractProfile(atlas, profile, servantTraits) {
  const np = targetNp(atlas, profile);
  const detail = loreDetail(atlas);
  return { traits: traitIds(atlas), ...(detail === undefined ? {} : { lore: { detail } }),
    special_attack: specialAttack(np, servantTraits), instant_death: instantDeathSources(atlas, np).length > 0 };
}

const ATTACK_BUFFS = new Set(['upAtk', 'upDamage', 'upNpdamage', 'upCommandall', 'upCriticaldamage', 'pierceInvincible', 'breakAvoidance', 'addDamage']);
export function foeTraitCondition(skill, servantTraits) {
  const attacks = (skill.functions ?? []).filter((fn) => !/enemy/i.test(fn.funcTargetType ?? ''))
    .flatMap((fn) => (fn.buffs ?? []).filter((buff) => ATTACK_BUFFS.has(buff.type) || /^upDamageIndividuality/.test(buff.type)));
  if (!attacks.length) return [];
  const ids = [];
  for (const buff of attacks) {
    const candidates = buff.ckOpIndv?.length ? buff.ckOpIndv
      : /^upDamageIndividuality/.test(buff.type) ? (buff.tvals?.length ? buff.tvals : buff.vals ?? []) : [];
    if (!candidates.length || candidates.some((item) => item.negative || !servantTraits.has(item.id))) return [];
    ids.push(...candidates.map((item) => item.id));
  }
  return [...new Set(ids)].sort((a, b) => a - b);
}
