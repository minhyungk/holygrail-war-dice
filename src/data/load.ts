// 판 단위 데이터 로딩 (D-065): 그 판에 나오는 서번트·마스터 폴더만 동적으로 불러온다.
// 빌드 시 폴더별로 청크가 나뉜다 (Vite import.meta.glob).
import { DialogueFile } from './schema';

const servantDialogue = import.meta.glob<{ default: unknown }>('/data/servants/*/dialogue.json');
const masterDialogue = import.meta.glob<{ default: unknown }>('/data/masters/*/dialogue.json');
const commonNarration = import.meta.glob<{ default: unknown }>('/data/common/*.json');

async function loadOne(table: Record<string, () => Promise<{ default: unknown }>>, path: string): Promise<DialogueFile> {
  const loader = table[path];
  if (!loader) throw new Error(`데이터 없음: ${path}`);
  return DialogueFile.parse((await loader()).default);
}

export async function loadRunDialogue(servantIds: readonly string[], masterIds: readonly string[]) {
  const [servants, masters, narrator] = await Promise.all([
    Promise.all(servantIds.map((id) => loadOne(servantDialogue, `/data/servants/${id}/dialogue.json`))),
    Promise.all(masterIds.map((id) => loadOne(masterDialogue, `/data/masters/${id}/dialogue.json`))),
    loadOne(commonNarration, '/data/common/narrator.json'),
  ]);
  return { servants, masters, narrator };
}

export const availableServantIds = () => Object.keys(servantDialogue).map((p) => p.split('/')[3]!);
export const availableMasterIds = () => Object.keys(masterDialogue).map((p) => p.split('/')[3]!);
