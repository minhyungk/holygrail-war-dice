import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { availableServantIds } from './load';
import { SERVANT_ID } from './schema';

const root = join(__dirname, '..', '..');
const folder = join(root, 'data/servants-pool');
const read = (path: string) => JSON.parse(readFileSync(join(folder, path), 'utf8'));

it('Atlas 준비 자료는 전원 ID·출처·대사가 있고, 게임 로더에는 편입 명단만 들어간다 (D-152, D-157)', () => {
  const manifest = read('manifest.json');
  // activation/은 편입 명단·분류표 폴더 (D-157)
  const ids = readdirSync(folder, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name.startsWith('sv_')).map((e) => e.name);
  expect(ids.length).toBe(manifest.prepared);
  expect(manifest.failed_details).toEqual([]);
  const roster: { servant_id: string }[] = read('activation/roster.json').servants;
  expect(availableServantIds().sort()).toEqual(roster.map((s) => s.servant_id).sort());

  const missingVoices: string[] = [];
  const incompleteImages: string[] = [];
  for (const id of ids) {
    expect(id).toMatch(SERVANT_ID);
    const source = read(`${id}/source.json`);
    const voice = read(`${id}/voice-lines.json`);
    expect(source.servant_id).toBe(id);
    expect(id.startsWith(`sv_${String(source.source_id).padStart(4, '0')}_`)).toBe(true);
    expect(source.atlas_url).toBe(`https://api.atlasacademy.io/nice/KR/servant/${source.source_id}?lore=true`);
    expect(source.name_ko).toBeTruthy();
    expect(source.ranks).toBeTruthy();
    expect(Object.values(source.images).every((url) => typeof url === 'string' && url.startsWith('https://static.atlasacademy.io/'))).toBe(!manifest.incomplete_images.includes(id));
    expect(voice.origin).toBe('Atlas Academy KR nice API');
    if (!voice.groups.length) missingVoices.push(id);
    if (Object.values(source.images).some((url) => !url)) incompleteImages.push(id);
    expect(JSON.stringify(voice)).not.toContain('audioAssets');
  }
  expect(missingVoices.sort()).toEqual(manifest.missing_voice_lines);
  expect(incompleteImages.sort()).toEqual(manifest.incomplete_images);
});
