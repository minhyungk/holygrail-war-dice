// 판 단위 데이터 로딩 (D-065): 그 판에 나오는 서번트·마스터 폴더만 동적으로 불러온다.
// 빌드 시 폴더별로 청크가 나뉜다 (Vite import.meta.glob).
import { BeatsFile, DialogueFile, LabelsFile, MasterProfile, ServantProfile, ServantSkillsFile, SummonChantFile } from './schema';

type Table = Record<string, () => Promise<{ default: unknown }>>;
const servantDialogue = import.meta.glob<{ default: unknown }>('/data/servants/*/dialogue.json');
const servantProfile = import.meta.glob<{ default: unknown }>('/data/servants/*/profile.json');
const servantSkills = import.meta.glob<{ default: unknown }>('/data/servants/*/skills.json');
const masterDialogue = import.meta.glob<{ default: unknown }>('/data/masters/*/dialogue.json');
const masterProfile = import.meta.glob<{ default: unknown }>('/data/masters/*/profile.json');
const classDialogue = import.meta.glob<{ default: unknown }>('/data/classes/*/dialogue.json');
const common = import.meta.glob<{ default: unknown }>('/data/common/*.json');

async function loadRaw(table: Table, path: string): Promise<unknown> {
  const loader = table[path];
  if (!loader) throw new Error(`데이터 없음: ${path}`);
  return (await loader()).default;
}
const loadOne = async (table: Table, path: string) => DialogueFile.parse(await loadRaw(table, path));

export async function loadRunDialogue(servantIds: readonly string[], masterIds: readonly string[]) {
  const [servants, masters, narrator, speech] = await Promise.all([
    Promise.all(servantIds.map((id) => loadOne(servantDialogue, `/data/servants/${id}/dialogue.json`))),
    Promise.all(masterIds.map((id) => loadOne(masterDialogue, `/data/masters/${id}/dialogue.json`))),
    loadOne(common, '/data/common/narrator.json'),
    // 서번트 공통 대사 (3층, D-143): 서번트·클래스 대사가 없을 때 누구나 쓰는 말
    loadOne(common, '/data/common/speech.json'),
  ]);
  return { servants, masters, narrator, speech };
}

/** 그 판에 나오는 서번트 클래스의 공통 대사 (§6.1). 폴더가 없는 클래스는 건너뛴다 */
export async function loadClassDialogue(classes: readonly string[]): Promise<DialogueFile[]> {
  const paths = [...new Set(classes)].map((c) => `/data/classes/${c}/dialogue.json`).filter((p) => classDialogue[p]);
  return Promise.all(paths.map((p) => loadOne(classDialogue, p)));
}

/** 그 판에 나오는 서번트 프로필만 불러온다 (D-065) */
export async function loadServantProfiles(servantIds: readonly string[]): Promise<ServantProfile[]> {
  return Promise.all(servantIds.map(async (id) => ServantProfile.parse(await loadRaw(servantProfile, `/data/servants/${id}/profile.json`))));
}
export async function loadServantSkills(servantIds: readonly string[]): Promise<ServantSkillsFile[]> {
  return Promise.all(servantIds.map(async (id) => ServantSkillsFile.parse(await loadRaw(servantSkills, `/data/servants/${id}/skills.json`))));
}
export async function loadMasterProfiles(masterIds: readonly string[]): Promise<MasterProfile[]> {
  return Promise.all(masterIds.map(async (id) => MasterProfile.parse(await loadRaw(masterProfile, `/data/masters/${id}/profile.json`))));
}
export async function loadNarrationCommon() {
  const [labels, beats, chant] = await Promise.all([loadRaw(common, '/data/common/labels.json'), loadRaw(common, '/data/common/beats.json'), loadRaw(common, '/data/common/summon.json')]);
  return { labels: LabelsFile.parse(labels), beats: BeatsFile.parse(beats), chant: SummonChantFile.parse(chant).lines };
}

export const availableServantIds = () => Object.keys(servantDialogue).map((p) => p.split('/')[3]!);
export const availableMasterIds = () => Object.keys(masterDialogue).map((p) => p.split('/')[3]!);
