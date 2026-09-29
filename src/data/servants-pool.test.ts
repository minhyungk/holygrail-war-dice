import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { availableServantIds } from './load';
import { SERVANT_ID } from './schema';

const root = join(__dirname, '..', '..');
const folder = join(root, 'data/servants-pool');
const read = (path: string) => JSON.parse(readFileSync(join(folder, path), 'utf8'));

it('Atlas 준비 자료는 전원 ID·출처·대사가 있고 게임 로더에서는 제외된다 (D-152)', () => {
  const manifest = read('manifest.json');
  const ids = readdirSync(folder, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  expect(ids.length).toBe(manifest.prepared);
  expect(manifest.failed_details).toEqual([]);
  expect(availableServantIds().sort()).toEqual([...manifest.active_game_servants].sort());

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
