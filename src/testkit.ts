// 테스트 도구 (게임 코드에서 import하지 않는다).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { K } from './data/constants';
import { ServantProfile } from './data/schema';
import type { BattleDice } from './engine/combat';

const ROOT = join(__dirname, '..');

export const servantIds = (): string[] => readdirSync(join(ROOT, 'data/servants')).sort();
export const servant = (id: string): ServantProfile => ServantProfile.parse(JSON.parse(readFileSync(join(ROOT, `data/servants/${id}/profile.json`), 'utf-8')));

export const SV = {
  artoria: 'sv_0002_artoria',
  emiya: 'sv_0011_emiya',
  cu: 'sv_0017_cu_chulainn',
  medusa: 'sv_0023_medusa',
  medea: 'sv_0031_medea',
  kojiro: 'sv_0039_kojiro',
  heracles: 'sv_0047_heracles',
} as const;
/** 시작 7기 밖의 예시용 서번트 (즉사 수단 보유, D-163) */
export const HASSAN = 'sv_0040_hassan_of_the_cursed_arm';

/** 자연값을 주사위 눈으로 나눈다 (예: 2d6에서 7 → [6, 1]) */
export function splitNatural(n: number): number[] {
  const count = K['dice.die_count'];
  const size = K['dice.die_size'];
  if (n < count || n > count * size) throw new RangeError(`자연값 ${n} 불가`);
  const dice: number[] = [];
  let left = n;
  for (let i = count; i > 0; i--) {
    const d = Math.min(size, left - (i - 1));
    dice.push(d);
    left -= d;
  }
  return dice;
}

/**
 * 정해진 값을 차례로 내는 주사위. rolls는 자연값, draws는 추첨값(국면 추첨 0~99, 공격측 0=a/1=b).
 * 다 쓰지 않았거나 모자라면 테스트가 실패하도록 remaining()을 확인한다.
 */
export function scriptedDice(rolls: number[], draws: number[]): BattleDice & { remaining(): { rolls: number; draws: number } } {
  let ri = 0;
  let di = 0;
  return {
    roll() {
      if (ri >= rolls.length) throw new Error('scriptedDice: 굴림 값이 모자란다');
      const natural = rolls[ri++]!;
      return { dice: splitNatural(natural), natural };
    },
    draw(n) {
      if (di >= draws.length) throw new Error('scriptedDice: 추첨 값이 모자란다');
      const v = draws[di++]!;
      if (v < 0 || v >= n) throw new RangeError(`scriptedDice: 추첨 값 ${v}이 0~${n - 1} 밖`);
      return v;
    },
    remaining: () => ({ rolls: rolls.length - ri, draws: draws.length - di }),
  };
}

import { MasterProfile, ServantSkillsFile } from './data/schema';
import type { RunData } from './engine/run';

export const masterIds = (): string[] => readdirSync(join(ROOT, 'data/masters')).sort();
const readJson = (p: string) => JSON.parse(readFileSync(join(ROOT, p), 'utf-8'));
/** 모든 서번트·마스터 데이터 (테스트용. 게임은 판 단위로 불러온다) */
export function runData(): RunData {
  const data: RunData = { servants: {}, skills: {}, masters: {} };
  for (const id of servantIds()) {
    data.servants[id] = servant(id);
    data.skills[id] = ServantSkillsFile.parse(readJson(`data/servants/${id}/skills.json`));
  }
  for (const id of masterIds()) data.masters[id] = MasterProfile.parse(readJson(`data/masters/${id}/profile.json`));
  return data;
}

import { BeatsFile, DialogueFile, LabelsFile } from './data/schema';
import { TILES } from './data/constants';
import type { NarratorData } from './narrative';

/** 서술 엔진 데이터 전부 (테스트용) */
export function narratorData(): NarratorData {
  const d = runData();
  return {
    servantDialogue: servantIds().map((id) => DialogueFile.parse(readJson(`data/servants/${id}/dialogue.json`))),
    masterDialogue: masterIds().map((id) => DialogueFile.parse(readJson(`data/masters/${id}/dialogue.json`))),
    classDialogue: readdirSync(join(ROOT, 'data/classes')).sort().map((c) => DialogueFile.parse(readJson(`data/classes/${c}/dialogue.json`))),
    narrator: DialogueFile.parse(readJson('data/common/narrator.json')),
    speech: DialogueFile.parse(readJson('data/common/speech.json')),
    servants: d.servants,
    skills: d.skills,
    masters: d.masters,
    tiles: TILES,
    labels: LabelsFile.parse(readJson('data/common/labels.json')),
    beats: BeatsFile.parse(readJson('data/common/beats.json')),
  };
}
