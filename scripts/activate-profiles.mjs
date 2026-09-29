/**
 * 준비 영역(data/servants-pool)의 Atlas 원본으로 편입 명단의 프로필을 만든다 (D-157).
 * - 명단: data/servants-pool/activation/roster.json, 분류표(짧은 이름·성향·성격): activation/meta.json
 * - 이미 data/servants/{id}/profile.json이 있는 서번트(시작 7기 등)는 건드리지 않는다.
 * - dialogue.json이 없으면 빈 파일을 만든다. 대사는 이어서 `node scripts/fetch-voices.mjs {id}`로 Atlas 보이스를 채운다.
 *
 * 실행: node scripts/activate-profiles.mjs [--dry]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const dry = process.argv.includes('--dry');
const read = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
const roster = read('data/servants-pool/activation/roster.json').servants;
const meta = read('data/servants-pool/activation/meta.json').servants;

/** 빈 대사 파일. 대사는 fetch-voices가 채우고, 없는 상황은 클래스·공통 대사층이 맡는다 (D-143) */
function writeDialogue(dir, id) {
  const dialogue = {
    speaker: id,
    defaults: { status: 'draft', author: 'ai', weight: 1, repeat: 'always', source: 'fgo' },
    notes: 'D-157 자동 편입. 대사는 Atlas KR 보이스(scripts/fetch-voices.mjs)만 들어 있고, 없는 상황은 클래스·공통 대사층이 맡는다 (D-143).',
    tags: {},
  };
  writeFileSync(join(dir, 'dialogue.json'), `${JSON.stringify(dialogue, null, 2)}\n`);
}

let made = 0;
for (const { servant_id: id } of roster) {
  const dir = join(ROOT, 'data/servants', id);
  if (!dry && existsSync(dir) && !existsSync(join(dir, 'dialogue.json'))) writeDialogue(dir, id);
  if (existsSync(join(dir, 'profile.json'))) continue;
  const src = read(`data/servants-pool/${id}/source.json`);
  const m = meta[id];
  if (!m) throw new Error(`분류표에 없음: ${id}`);
  const np = src.noble_phantasms.at(-1);
  if (!np) throw new Error(`보구 없음: ${id}`);
  for (const k of ['face', 'summon', 'final']) if (!src.images[k]) throw new Error(`이미지 없음: ${id} ${k}`);
  const profile = {
    servant_id: id,
    source_id: src.source_id,
    name_ko: src.name_ko,
    name_short_ko: m.name_short_ko,
    class: src.class,
    ranks: src.ranks,
    alignment: m.alignment,
    alignment_detail: m.alignment_detail,
    alignment_verified: false,
    temperament: m.temperament,
    noble_phantasm: { name_ko: np.name, ruby_ko: np.ruby ?? np.name, rank: np.rank, type_ko: np.type },
    images: { face: src.images.face, summon: src.images.summon, final: src.images.final },
    sprite_id: null,
    notes: `Atlas KR 자동 생성 (D-157, scripts/activate-profiles.mjs). 스탯은 Atlas 랭크. 짧은 이름·성향 표기·성격은 AI 분류 초안 (activation/meta.json, 성격 근거 ${m.temperament_source}), 사용자 검수 전.`,
  };
  made++;
  if (dry) continue;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'profile.json'), `${JSON.stringify(profile, null, 2)}\n`);
  if (!existsSync(join(dir, 'dialogue.json'))) writeDialogue(dir, id);
}
console.log(`${dry ? '(dry) ' : ''}프로필 ${made}개 생성`);
