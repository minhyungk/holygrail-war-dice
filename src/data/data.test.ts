// 데이터 검증 (04-data-schema.md §2, narrative-engine.md §9 대사 검증기의 첫 단계).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { K, parseConstants, parsePhases } from './constants';
import { DialogueFile, MASTER_ID, SERVANT_ID, ServantProfile, TERRAINS, unknownPlaceholders } from './schema';
import { availableMasterIds, availableServantIds, loadRunDialogue, loadServantProfiles } from './load';
import { parseRank } from '../engine/stats';

const ROOT = join(__dirname, '..', '..');
const read = (p: string) => JSON.parse(readFileSync(join(ROOT, p), 'utf-8'));
const servants = readdirSync(join(ROOT, 'data/servants'));
const masters = readdirSync(join(ROOT, 'data/masters'));
const dialogueFiles = [
  ...servants.map((id) => `data/servants/${id}/dialogue.json`),
  ...masters.map((id) => `data/masters/${id}/dialogue.json`),
  'data/common/narrator.json',
];

describe('폴더와 ID', () => {
  it.each(servants)('서번트 %s: ID 규칙(D-066)과 profile.servant_id 일치', (id) => {
    expect(id).toMatch(SERVANT_ID);
    expect(read(`data/servants/${id}/profile.json`).servant_id).toBe(id);
  });
  it.each(servants)('서번트 %s: profile 형식과 6스탯 랭크 표기', (id) => {
    const p = ServantProfile.parse(read(`data/servants/${id}/profile.json`));
    for (const rank of Object.values(p.ranks)) expect(() => parseRank(rank)).not.toThrow();
  });
  it.each(masters)('마스터 %s: ID 규칙과 profile.master_id 일치', (id) => {
    expect(id).toMatch(MASTER_ID);
    expect(read(`data/masters/${id}/profile.json`).master_id).toBe(id);
  });
});

describe.each(dialogueFiles)('%s', (path) => {
  const raw = read(path);
  it('형식 (narrative-engine.md §5.2)', () => {
    const r = DialogueFile.safeParse(raw);
    if (!r.success) throw new Error(r.error.issues.slice(0, 5).map((i) => `${i.path.join('.')}: ${i.message}`).join('\n'));
  });
  it('태그 안에서 id가 겹치지 않는다', () => {
    for (const [tag, lines] of Object.entries(raw.tags as Record<string, { id: string }[]>)) {
      const ids = lines.map((l) => l.id);
      expect(new Set(ids).size, `${tag} 중복 id`).toBe(ids.length);
    }
  });
  it('자리표시자는 목록에 있는 것만 쓴다 (§7.1)', () => {
    const bad = Object.values(raw.tags as Record<string, { text: string }[]>).flat().flatMap((l) => unknownPlaceholders(l.text));
    expect(bad).toEqual([]);
  });
});

describe('판 단위 로딩 (D-065)', () => {
  it('데이터 폴더가 로더 목록과 일치한다', () => {
    expect(availableServantIds().sort()).toEqual([...servants].sort());
    expect(availableMasterIds().sort()).toEqual([...masters].sort());
  });
  it('지정한 서번트·마스터만 불러온다', async () => {
    const run = await loadRunDialogue(['sv_0002_artoria', 'sv_0017_cu_chulainn'], ['ms_tohsaka_rin']);
    expect(run.servants.map((s) => s.speaker)).toEqual(['sv_0002_artoria', 'sv_0017_cu_chulainn']);
    expect(run.masters[0]!.speaker).toBe('ms_tohsaka_rin');
    expect(run.narrator.scope).toBe('common');
  });
});

describe('판정 엔진 데이터 (04-data-schema.md §2)', () => {
  it('constants.json: 키 중복 없음, 키별 형식 통과', () => {
    expect(() => parseConstants(read('data/constants.json'))).not.toThrow();
  });
  it('constants.json: 중복 키는 거부한다', () => {
    const raw = read('data/constants.json');
    raw.constants.push(raw.constants[0]);
    expect(() => parseConstants(raw)).toThrow(/중복/);
  });
  it('phases.json: 국면 목록(phases.md §2)과 일치', () => {
    expect(Object.keys(parsePhases(read('data/phases.json'))).sort()).toEqual(
      ['ph_clash', 'ph_fate', 'ph_initiative', 'ph_np_attack', 'ph_np_clash', 'ph_sorcery'],
    );
  });
  it('지형 가중치는 지형 목록 전부를 덮는다', () => {
    expect(Object.keys(K['phase.weights_by_terrain']).sort()).toEqual([...TERRAINS].sort());
  });
  it('판 단위로 서번트 프로필을 불러온다 (D-065)', async () => {
    const [a] = await loadServantProfiles(['sv_0002_artoria']);
    expect(a!.servant_id).toBe('sv_0002_artoria');
  });
});
