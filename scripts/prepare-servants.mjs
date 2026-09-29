/** Atlas KR 원본을 게임 로더 밖에 보관한다. 실행: node scripts/prepare-servants.mjs */
import { readFile, readdir, mkdir, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';

const api = 'https://api.atlasacademy.io';
const classes = new Set(['saber', 'archer', 'lancer', 'rider', 'caster', 'assassin', 'berserker', 'ruler', 'avenger', 'moonCancer', 'alterEgo', 'foreigner', 'pretender', 'shielder']);
const out = 'data/servants-pool';
const activeIds = await readdir('data/servants');
const previousIds = await readdir(out).catch((error) => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
const previous = await Promise.all(previousIds.filter((id) => id.startsWith('sv_')).map(async (servantId) => {
  const source = JSON.parse(await readFile(join(out, servantId, 'source.json'), 'utf8'));
  return [source.source_id, servantId];
}));
const current = await Promise.all(activeIds.map(async (servantId) => {
  const profile = JSON.parse(await readFile(join('data/servants', servantId, 'profile.json'), 'utf8'));
  return [profile.source_id, servantId];
}));
const existing = new Map([...previous, ...current]);
const legacy = new Map(JSON.parse(await readFile('legacy/data/servants-ko.json', 'utf8')).map((s) => [s.id, s]));
const legacyVoices = JSON.parse(await readFile('legacy/data/dialogues-ko.json', 'utf8'));

async function getJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

function slug(name, id) {
  const value = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  return value || `servant_${id}`;
}

function assets(raw, basic) {
  const extra = raw?.extraAssets ?? {};
  return {
    face: extra.faces?.ascension?.['1'] ?? basic.face ?? null,
    summon: extra.charaGraph?.ascension?.['1'] ?? null,
    final: Object.entries(extra.charaGraph?.ascension ?? {}).sort(([a], [b]) => Number(b) - Number(a))[0]?.[1] ?? null,
  };
}

function voiceLines(raw, id) {
  if (!raw) return { origin: 'legacy', groups: [], legacy_five_tags: legacyVoices[id] ?? null };
  return {
    origin: 'Atlas Academy KR nice API',
    groups: (raw.profile?.voices ?? []).map((group) => ({
      type: group.type,
      voice_prefix: group.voicePrefix ?? null,
      lines: (group.voiceLines ?? []).map((line) => ({
        name: line.name ?? '',
        ids: line.id ?? [],
        subtitle: line.subtitle ?? '',
        text: line.text ?? [],
        cond_type: line.condType ?? null,
        cond_value: line.condValue ?? null,
      })).filter((line) => line.subtitle.trim() || line.text.some((part) => part.trim())),
    })).filter((group) => group.lines.length),
  };
}

async function save(path, data) {
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`);
  await rename(temporary, path);
}

const [kr, na] = await Promise.all([
  getJson(`${api}/export/KR/basic_servant.json`),
  getJson(`${api}/export/NA/basic_servant.json`),
]);
const english = new Map(na.map((s) => [s.collectionNo, s.name]));
const playable = kr.filter((s) => classes.has(s.className) && s.collectionNo > 0);
await mkdir(out, { recursive: true });
const failed = [];
const missingVoices = [];
const missingImages = [];
let completed = 0;
const queue = [...playable];

async function worker() {
  while (queue.length) {
    const basic = queue.shift();
    const id = basic.collectionNo;
    const servantId = existing.get(id) ?? `sv_${String(id).padStart(4, '0')}_${slug(english.get(id) ?? '', id)}`;
    const directory = join(out, servantId);
    await mkdir(directory, { recursive: true });
    let raw = null;
    try {
      raw = await getJson(`${api}/nice/KR/servant/${id}?lore=true`);
    } catch (error) {
      failed.push({ servant_id: servantId, error: String(error) });
    }
    const old = legacy.get(id);
    const stats = raw?.profile?.stats;
    const imageUrls = raw ? assets(raw, basic) : { face: basic.face ?? old?.imageUrl ?? null, summon: null, final: null };
    const voices = voiceLines(raw, id);
    if (!voices.groups.length) missingVoices.push(servantId);
    if (Object.values(imageUrls).some((url) => !url)) missingImages.push(servantId);
    await save(join(directory, 'source.json'), {
      servant_id: servantId,
      source_id: id,
      name_ko: raw?.name ?? basic.name ?? old?.name ?? null,
      name_en: english.get(id) ?? null,
      class: basic.className,
      atlas_url: `${api}/nice/KR/servant/${id}?lore=true`,
      source: raw ? 'Atlas Academy KR nice API' : (old ? 'legacy/data/servants-ko.json' : 'Atlas Academy KR basic export'),
      ranks: stats ? { str: stats.strength, end: stats.endurance, agi: stats.agility, mana: stats.magic, luck: stats.luck, np: stats.np } : (old?.stats ?? null),
      traits: raw?.traits ?? basic.traits ?? [],
      skills: raw ? {
        class_passive: (raw.classPassive ?? []).map((s) => ({ id: s.id, name: s.name, rank: s.rank ?? null })),
        personal: (raw.skills ?? []).map((s) => ({ id: s.id, name: s.name, rank: s.rank ?? null })),
      } : (old ? { class_passive: old.classSkills, personal: old.personalSkills } : null),
      noble_phantasms: raw ? (raw.noblePhantasms ?? []).map((np) => ({ id: np.id, name: np.name, ruby: np.ruby, rank: np.rank, type: np.type })) : (old?.noblePhantasm ? [old.noblePhantasm] : []),
      images: imageUrls,
    });
    await save(join(directory, 'voice-lines.json'), voices);
    completed++;
    if (completed % 25 === 0 || completed === playable.length) console.log(`${completed}/${playable.length} prepared`);
  }
}
await Promise.all(Array.from({ length: 8 }, () => worker()));
await save(join(out, 'manifest.json'), {
  source: 'Atlas Academy KR/NA basic export and KR nice API',
  prepared: playable.length,
  failed_details: failed,
  missing_voice_lines: missingVoices.sort(),
  incomplete_images: missingImages.sort(),
  active_game_servants: activeIds,
});
console.log(`Done: ${playable.length} folders, ${failed.length} detailed fetch failures`);
if (failed.length) process.exitCode = 1;
