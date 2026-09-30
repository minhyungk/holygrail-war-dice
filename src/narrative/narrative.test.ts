// docs/systems/narrative-engine.md §13 예시 + §8 규칙
import { describe, expect, it } from 'vitest';
import { isActiveSkill, SKILLS } from '../data/constants';
import { DialogueFile, type Line } from '../data/schema';
import { EventLog, type FactionSetup } from '../engine/events';
import { INTEL } from '../engine/intel';
import { createRng } from '../engine/rng';
import { masterIds, narratorData, runData, servantIds, SV } from '../testkit';
import { simulateRun } from '../engine/sim';
import { Narrator } from './index';
import { josa } from './josa';
import { type Candidate, type Memory, pick } from './select';

const data = narratorData();
const cand = (id: string, layer: number, when?: Line['when'], repeat?: Line['repeat']): Candidate => ({
  line: { id, text: id, when, repeat } as Line,
  textId: `tx_${id}`,
  layer,
  speaker: 'x',
});
const mem = (): Memory => ({ said: new Map(), beat: 0, lastInPool: new Map() });

/** 화면 줄의 textId → 공통 나레이션 원본 줄. 나레이션은 묶음마다 여러 줄이라(D-166) id 대신 조건으로 판정한다 */
const NARR = new Map<string, Line>(Object.entries(data.narrator.tags).flatMap(([tag, ls]) => ls.map((l): [string, Line] => [`tx_common_${tag}_${l.id}`, l])));
const src = (textId: string | undefined) => (textId ? NARR.get(textId) : undefined);
/** 이름이 문장에 나오나. 두 글자 이하 이름(예: 나타)은 뒤에 조사·문장부호가 올 때만 이름으로 본다 ('나타난다' 오탐 방지) */
const mentions = (text: string, name: string) =>
  name.length > 2 ? text.includes(name) : new RegExp(`${name}(?=[이가은는을를의와과도에게께,.!?…\\s」』)─]|$)`).test(text);

describe('선택 규칙 (§6, §13 예시 1·2)', () => {
  const facts = { 'self.servant': SV.emiya, 'enemy.servant': SV.cu, 'mem.met_before': true };
  const A = cand('common', 2);
  const B = cand('emiya', 0, { 'self.servant': SV.emiya });
  const C = cand('reunion', 0, { 'self.servant': SV.emiya, 'enemy.servant': SV.cu, 'mem.met_before': true }, 'once_per_run');
  it('1. 구체성: 조건 3개인 C가 이긴다', () => expect(pick([A, B, C], facts, mem(), createRng(1), 'p')!.textId).toBe('tx_reunion'));
  it('2. 반복 제외: C가 once_per_run이고 이미 말했으면 B', () => {
    const m = mem();
    pick([A, B, C], facts, m, createRng(1), 'p');
    m.beat += 1;
    expect(pick([A, B, C], facts, m, createRng(1), 'p')!.textId).toBe('tx_emiya');
  });
  it('조건 하나라도 틀리면 후보가 아니다', () => {
    expect(pick([C], { ...facts, 'mem.met_before': false }, mem(), createRng(1), 'p')).toBeNull();
  });
  it('계층이 먼저: 서번트 > 클래스 > 공통 (§6.1, D-144)', () => {
    expect(pick([cand('cls', 1), cand('common', 2)], {}, mem(), createRng(1), 'p')!.textId).toBe('tx_cls');
    // 조건이 더 많은 클래스 대사도 서번트 대사를 이기지 못한다
    const cls = cand('cls_align', 1, { 'self.alignment': 'good', 'mem.released': true });
    expect(pick([cand('sv', 0), cls], { 'self.alignment': 'good', 'mem.released': true }, mem(), createRng(1), 'p')!.textId).toBe('tx_sv');
  });
  it('서번트 대사가 전부 조건·반복에 걸리면 클래스로 떨어진다 (§6.1)', () => {
    const sv = cand('sv_once', 0, undefined, 'once_per_run');
    const m = mem();
    expect(pick([sv, cand('cls', 1)], {}, m, createRng(1), 'p')!.textId).toBe('tx_sv_once');
    m.beat += 1;
    expect(pick([sv, cand('cls', 1)], {}, m, createRng(1), 'p')!.textId).toBe('tx_cls');
    expect(pick([cand('sv_good', 0, { 'self.alignment': 'good' }), cand('cls', 1)], { 'self.alignment': 'evil' }, mem(), createRng(1), 'p')!.textId).toBe('tx_cls');
  });
  it('연산자: gte, lt, in, not', () => {
    const g = cand('g', 0, { n: { gte: 5 } });
    expect(pick([g], { n: 5 }, mem(), createRng(1), 'p')).not.toBeNull();
    expect(pick([g], { n: 4 }, mem(), createRng(1), 'p')).toBeNull();
    expect(pick([cand('i', 0, { t: { in: ['a', 'b'] } })], { t: 'b' }, mem(), createRng(1), 'p')).not.toBeNull();
    expect(pick([cand('n', 0, { t: { not: 'a' } })], { t: 'a' }, mem(), createRng(1), 'p')).toBeNull();
  });
  it('[[PLACEHOLDER]] 대사는 출력하지 않는다', () => {
    const ph = { ...cand('ph', 0), line: { id: 'ph', text: '[[PLACEHOLDER: x]]' } as Line };
    expect(pick([ph], {}, mem(), createRng(1), 'p')).toBeNull();
  });
});

describe('조사 (§7.3, §13 예시 4)', () => {
  it.each([
    ['메두사', '을/를', '를'],
    ['헤라클레스', '와/과', '와'],
    ['에미야', '으로/로', '로'],
    ['쿠 훌린', '이/가', '이'],
    ['랜서', '이/가', '가'],
    ['아처', '은/는', '는'],
    ['헤라클레스', '을/를', '를'],
    ['세이버', '와/과', '와'],
    ['코지로', '으로/로', '로'],
    ['알', '으로/로', '로'], // ㄹ 받침
    ['집', '으로/로', '으로'],
    ['심안(가짜)', '이/가', '이'], // 끝의 괄호 표기는 읽지 않는다
    ['약속된 승리의 검(엑스칼리버)', '을/를', '을'],
  ] as const)('%s + %s → %s', (w, p, j) => expect(josa(w, p)).toBe(j));
});

/** 플레이어 알트리아 vs 쿠 훌린(적 1), 수변 전투를 이벤트로 흘린다 */
function scenario(cuIntel: number) {
  const log = new EventLog({ day: 1, time: 'day', action: 0 });
  const fs = (faction: string, sv: string, ms: string | null, controller: 'player' | 'ai'): FactionSetup => ({
    faction, servant_id: sv, master_id: ms, controller, tile: 'tl_r2c2', condition: 'full', mana: 0, seals: 3, fate_points: 3, affinity: controller === 'player' ? 35 : null,
  });
  log.emit('run_started', [], { seed: 1, player: 'fc_player', summon: 'random', factions: [fs('fc_player', SV.artoria, null, 'player'), fs('fc_e1', SV.cu, 'ms_bazett', 'ai')] });
  if (cuIntel) log.emit('intel_gained', [], { target: 'fc_e1', level_from: 0, level_to: cuIntel, result: 'success', cause: 'np', roll: null, dc: null });
  log.clock = { day: 1, time: 'night', action: 1 };
  log.emit('encounter', [], { tile: 'tl_r2c2', terrain: 'river', factions: ['fc_player', 'fc_e1'], bystanders: [], ambusher: null, ambush_rolls: [] });
  log.emit('battle_started', [], { battle_id: 'bt_001', tile: 'tl_r2c2', terrain: 'river', is_final: false, ambusher: null, sides: ['fc_player', 'fc_e1'], underdog: null });
  return log;
}

describe('비트 (§8, §13 예시 3·5)', () => {
  it('5. 전투 개시: lead(장소) → lead(상대) → line → answer → react → tail 순서, 큰 비트', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const n = new Narrator(data, seed);
      const beats = scenario(1).events.map((e) => n.consume(e)).filter((b) => b);
      const b = beats.find((x) => x!.type === 'battle_started')!;
      expect(b.size).toBe('big');
      const slots = b.lines.map((l) => l.slot);
      expect(slots.slice(0, 2)).toEqual(['lead', 'lead']);
      expect(src(b.lines[0]!.textId)?.when?.['world.terrain']).toBe('river');
      expect(src(b.lines[1]!.textId)?.when?.['enemy.intel_level']).toEqual({ in: [1, 2] });
      expect(b.lines[1]!.text).toContain('랜서');
      expect(b.lines[1]!.text).not.toContain('쿠 훌린');
      expect(slots).toContain('line');
      expect(slots.indexOf('answer')).toBeGreaterThan(slots.indexOf('line'));
      expect(b.lines.length).toBeLessThanOrEqual(6);
      // 나레이션 연속 상한 2 (§8.5)
      let run = 0;
      for (const l of b.lines) expect((run = l.speaker === 'narrator' ? run + 1 : 0)).toBeLessThanOrEqual(2);
      // 정보 가림: 쿠 훌린의 화자 이름은 클래스명
      expect(b.lines.find((l) => l.slot === 'answer')?.speakerName ?? '랜서').toBe('랜서');
    }
  });
  it('react는 바로 앞 대사의 tone에 반응한다 (Q-156 ①)', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const n = new Narrator(data, seed);
      const b = scenario(1).events.map((e) => n.consume(e)).find((x) => x?.type === 'battle_started')!;
      const react = b.lines.find((l) => l.slot === 'react');
      if (!react) continue;
      const i = b.lines.indexOf(react);
      const prev = [...b.lines.slice(0, i)].reverse().find((l) => l.speaker !== 'narrator')!;
      const tone = react.textId.replace('tx_common_battle_start_react_', '');
      const all = [...data.servantDialogue, ...data.masterDialogue].find((f) => f.speaker === prev.speaker)!;
      const src = Object.values(all.tags).flat().find((l) => prev.textId.endsWith(`_${l.id}`) && l.text.length > 0);
      expect(src?.tone ?? all.defaults.tone).toBe(tone);
    }
  });
  it('3. 정보 가림: 0단계 "정체불명의 서번트", 1단계 "랜서", 3단계 "쿠 훌린"', () => {
    const lead = (lv: number) => {
      const n = new Narrator(data, 3);
      const b = scenario(lv).events.map((e) => n.consume(e)).find((x) => x?.type === 'battle_started')!;
      return b.lines[1]!.text;
    };
    expect(lead(0)).not.toMatch(/랜서|쿠 훌린/);
    expect(lead(1)).toContain('랜서');
    expect(lead(1)).not.toContain('쿠 훌린');
    expect(lead(3)).toContain('쿠 훌린');
  });
  it('장소 묘사는 장면당 한 번 (§8.5)', () => {
    const n = new Narrator(data, 5);
    const log = scenario(1);
    const beats = log.events.map((e) => n.consume(e));
    const place = beats.flatMap((b) => b?.lines ?? []).filter((l) => src(l.textId)?.when?.['world.terrain'] !== undefined);
    expect(place).toHaveLength(1);
  });
});

describe('한 판 전체 서술 (헤드리스)', () => {
  const rd = runData();
  void rd;
  it('판 20개를 서술해도 오류가 없고, 적의 진명은 진명(정보 2단계) 전에는 나오지 않는다', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const r = simulateRun({ seed, data: runData(), servantIds: servantIds(), masterIds: masterIds() });
      const n = new Narrator(data, seed);
      for (const e of r.log.events) {
        const b = n.consume(e);
        if (!b) continue;
        for (const l of b.lines) {
          expect(l.text).not.toMatch(/\{[a-z_]+\}/);
          expect(l.text).not.toContain('[image');
          for (const [fc, f] of Object.entries(n.state.factions)) {
            if (fc === n.state.player || (n.state.intel[fc] ?? 0) >= INTEL.name) continue;
            const name = data.servants[f.servant_id]!.name_ko;
            // 적 서번트 자신의 대사 본문(자기 이름)은 제외하고, 이름표·나레이션에서 진명이 새지 않아야 한다
            if (l.speaker === 'narrator') expect(mentions(l.text, name), `${seed} ${l.textId}: ${l.text}`).toBe(false);
            if (l.speakerName) expect(l.speakerName).not.toBe(name);
            // 미공개 적 서번트의 대사도 자기 진명·보구명을 말하지 않는다 (D-153: 정체 노출 줄은 self.intel_level {gte: 2} 조건, D-158)
            if (l.speaker === f.servant_id) {
              const np = data.servants[f.servant_id]!.noble_phantasm;
              for (const w of [name, np?.name_ko, np?.ruby_ko].filter(Boolean)) expect(mentions(l.text, w!), `${seed} ${l.textId}: ${l.text}`).toBe(false);
            }
          }
        }
        expect(b.lines.length).toBeLessThanOrEqual(6);
      }
      expect(n.spoken.length).toBeGreaterThan(0);
    }
  });
  it('편입 서번트 전원: 촉매로 골라 한 판을 끝까지 돌려도 오류·빈 자리표시자·진명 누출이 없다 (D-157, 04-data-schema.md §7.3)', () => {
    const rd = runData();
    for (const [i, id] of servantIds().entries()) {
      const seed = 1000 + i;
      const r = simulateRun({ seed, data: rd, servantIds: servantIds(), masterIds: masterIds(), catalyst: id });
      const n = new Narrator(data, seed);
      n.summonLine(id); // 소환 대사가 없으면 null (클래스·공통층으로 떨어지지 않는 태그)
      for (const e of r.log.events) {
        const b = n.consume(e);
        for (const l of b?.lines ?? []) {
          expect(l.text, `${id} ${l.textId}`).not.toMatch(/\{[a-z_]+\}/);
          for (const [fc, f] of Object.entries(n.state.factions)) {
            if (fc === n.state.player || (n.state.intel[fc] ?? 0) >= INTEL.name || l.speaker !== f.servant_id) continue;
            const sv = data.servants[f.servant_id]!;
            for (const w of [sv.name_ko, sv.noble_phantasm.name_ko].filter((x) => x.length >= 2)) expect(mentions(l.text, w), `${id} ${l.textId}: ${l.text}`).toBe(false);
          }
        }
      }
    }
  });
  it('같은 시드 = 같은 서술 (§1)', () => {
    const r = simulateRun({ seed: 4, data: runData(), servantIds: servantIds(), masterIds: masterIds() });
    const tell = () => {
      const n = new Narrator(data, 4);
      return r.log.events.map((e) => n.consume(e)?.lines.map((l) => l.text).join('|') ?? '').join('\n');
    };
    expect(tell()).toBe(tell());
  });
});

describe('스킬 해설 (D-153)', () => {
  it('전투마다 스킬별 첫 발동만 해설하고, 미공개 적 스킬은 이름 없이 진영당 한 번', () => {
    let known = 0;
    let hidden = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const r = simulateRun({ seed, data: runData(), servantIds: servantIds(), masterIds: masterIds() });
      const n = new Narrator(data, seed);
      let told = new Set<string>();
      for (const e of r.log.events) {
        const b = n.consume(e);
        if (e.type === 'battle_started') told = new Set();
        if (e.type !== 'skill_triggered' || !b) continue;
        const react = b.lines.find((l) => l.textId.startsWith('tx_common_skill_effect_'));
        if (!react) continue;
        const isHidden = src(react.textId)?.when?.['event.skill_known'] === false;
        const key = `${e.data.faction}|${isHidden ? '?' : e.data.skill_id}`;
        expect(told.has(key), `${seed} ${key}`).toBe(false);
        told.add(key);
        const sk = data.skills[n.state.factions[e.data.faction]!.servant_id]!.skills.find((x) => x.skill_id === e.data.skill_id)!;
        const visible = e.data.faction === n.state.player || (n.state.intel[e.data.faction] ?? 0) >= INTEL.name;
        expect(isHidden).toBe(!visible);
        if (visible) (known++, expect(react.text).toContain(sk.name_ko));
        else (hidden++, expect(react.text).not.toContain(sk.name_ko));
      }
    }
    expect(known).toBeGreaterThan(0);
    expect(hidden).toBeGreaterThan(0);
  });
  it('전용 해설이 없는 스킬도 효과 종류별 범용·미공개 해설로 나온다 (D-143)', () => {
    const lines = data.narrator.tags.skill_effect!;
    for (const def of Object.values(SKILLS)) {
      if (!isActiveSkill(def)) continue;
      const general = lines.filter((l) => l.when?.['event.effect'] === def.effect.type && !l.when?.['event.skill_id']);
      expect(general.some((l) => l.when?.['event.skill_known'] === undefined), def.skill_id).toBe(true);
      expect(general.some((l) => l.when?.['event.skill_known'] === false), def.skill_id).toBe(true);
    }
  });
});

describe('호감도 변화 문구 (D-121)', () => {
  const beatFor = (from: number, to: number, cause: string) => {
    const log = scenario(0);
    log.emit('affinity_changed', ['fc_player'], { faction: 'fc_player', from, to, tier_from: from < 30 ? 'wary' : 'neutral', tier_to: to < 30 ? 'wary' : to < 50 ? 'neutral' : 'friendly', cause });
    const n = new Narrator(data, 9);
    return log.events.map((e) => n.consume(e)).filter(Boolean).at(-1)!;
  };
  it('시스템 문구 모양으로, 방향에 맞는 문구가 나온다', () => {
    const up = beatFor(35, 37, 'bond');
    expect(up.style).toBe('system');
    const upWhen = src(up.lines[0]!.textId)?.when ?? {};
    expect(upWhen['event.direction']).toBe('up');
    expect(upWhen['event.magnitude'] === 'small' || upWhen['event.cause'] === 'bond').toBe(true);
    const down = beatFor(35, 25, 'supply');
    const downLine = src(down.lines[0]!.textId)!;
    expect(downLine.when).toMatchObject({ 'event.direction': 'down', 'event.tier_to': 'wary' });
    if (downLine.text.includes('{servant}')) expect(down.lines[0]!.text).toContain('알트리아');
  });
});

describe('판정 행동의 도입 나레이션 (D-141)', () => {
  const roll = { dice: [3, 4], natural: 7, miracle: false, modifier: 0, applied_modifier: 0, total: 7, faction: 'fc_player', stats: [], parts: {}, rerolls: 0 };
  it.each([
    ['supply', 'mana_supplied'],
    ['bond', 'bond'],
  ] as const)('%s: 도입(lead)은 action_started에서 나오고, 결과 비트에는 없다', (action, resultType) => {
    const log = new EventLog({ day: 1, time: 'day', action: 0 });
    const fs = (faction: string, sv: string, controller: 'player' | 'ai'): FactionSetup => ({
      faction, servant_id: sv, master_id: null, controller, tile: 'tl_r2c2', condition: 'full', mana: 0, seals: 3, fate_points: 3, affinity: controller === 'player' ? 35 : null,
    });
    log.emit('run_started', [], { seed: 1, player: 'fc_player', summon: 'random', factions: [fs('fc_player', SV.artoria, 'player'), fs('fc_e1', SV.cu, 'ai')] });
    log.emit('action_started', ['fc_player'], { faction: 'fc_player', action, tile: 'tl_r2c2', target: null });
    if (resultType === 'mana_supplied') log.emit('mana_supplied', ['fc_player'], { faction: 'fc_player', result: 'normal', mana_before: 0, mana_after: 20, roll });
    else log.emit('bond', ['fc_player'], { faction: 'fc_player', result: 'success', roll, dc: 7 });
    const n = new Narrator(data, 3);
    const [, start, result] = log.events.map((e) => n.consume(e));
    expect(start!.lines.map((l) => l.slot)).toEqual(['lead']);
    // 공통 나레이션도 화자가 narrator다 (대사처럼 따옴표로 보이지 않게)
    expect(start!.lines[0]!.speaker).toBe('narrator');
    expect(result?.lines.some((l) => l.slot === 'lead') ?? false).toBe(false);
  });
});

describe('클래스 대사 (§6.1, D-143)', () => {
  it('전용 대사가 없는 서번트는 클래스 대사를 쓰고, 화자는 그 서번트다', () => {
    const cls = DialogueFile.parse({
      speaker: 'class:saber',
      scope: 'class:saber',
      defaults: {},
      tags: { day_bond: [{ id: 'bond_01', text: '클래스 교류' }], summon: [{ id: 'summon_01', text: '클래스 소환' }] },
    });
    const d = { ...data, servantDialogue: data.servantDialogue.filter((f) => f.speaker !== SV.artoria), classDialogue: [cls] };
    const n = new Narrator(d, 3);
    const summon = n.summonLine(SV.artoria)!;
    expect(summon.text).toBe('클래스 소환');
    expect(summon.speaker).toBe(SV.artoria);

    const log = new EventLog({ day: 1, time: 'day', action: 0 });
    const fs = (faction: string, sv: string, controller: 'player' | 'ai'): FactionSetup => ({
      faction, servant_id: sv, master_id: null, controller, tile: 'tl_r2c2', condition: 'full', mana: 0, seals: 3, fate_points: 3, affinity: controller === 'player' ? 35 : null,
    });
    log.emit('run_started', [], { seed: 1, player: 'fc_player', summon: 'random', factions: [fs('fc_player', SV.artoria, 'player'), fs('fc_e1', SV.cu, 'ai')] });
    log.emit('bond', ['fc_player'], { faction: 'fc_player', result: 'success', roll: { dice: [3, 4], natural: 7, miracle: false, modifier: 0, applied_modifier: 0, total: 7, faction: 'fc_player', stats: [], parts: {}, rerolls: 0 }, dc: 7 });
    const [, bond] = log.events.map((e) => n.consume(e));
    const line = bond!.lines.find((l) => l.slot === 'line')!;
    expect(line.textId).toBe('tx_class:saber_day_bond_bond_01');
    expect(line.speaker).toBe(SV.artoria);
  });
});

describe('전투 외침·선택 반응·약점·역전승 대사 (D-150, D-151)', () => {
  const said: string[] = [];
  const heracles: string[] = [];
  for (let seed = 1; seed <= 60; seed++) {
    const r = simulateRun({ seed, data: runData(), servantIds: servantIds(), masterIds: masterIds() });
    const n = new Narrator(data, seed);
    for (const e of r.log.events) {
      const b = n.consume(e);
      for (const l of b?.lines ?? []) {
        said.push(l.textId);
        if (l.speaker === SV.heracles) heracles.push(l.textId);
      }
    }
  }
  const has = (part: string) => said.some((t) => t.includes(part));
  it('국면 승리·피격 외침(FGO 보이스)과 스킬 외침이 나온다', () => {
    expect(has('_phase_win_fgo_')).toBe(true);
    expect(has('_phase_hit_')).toBe(true);
    expect(has('_skill_')).toBe(true);
  });
  it('외침은 확률 슬롯이라 매 국면 나오지는 않는다 (text.slot_chance)', () => {
    const wins = said.filter((t) => t.includes('_phase_win_')).length;
    const phases = said.filter((t) => t.includes('_phase_result_')).length;
    expect(wins).toBeGreaterThan(0);
    expect(wins).toBeLessThan(phases);
  });
  it('선택 반응 대사와 약점 공략 서술이 나온다', () => {
    expect(has('_react_choice_')).toBe(true);
    expect(has('tx_common_weakness_')).toBe(true);
  });
  it('말하지 않는 헤라클레스는 공통 대사(말)로 떨어지지 않는다', () => {
    expect(heracles.some((t) => t.startsWith('tx_common_speech_'))).toBe(false);
  });
});

describe('역전승 (D-151)', () => {
  const setup = () => {
    const log = new EventLog({ day: 2, time: 'night', action: 1 });
    const fs = (faction: string, sv: string, controller: 'player' | 'ai'): FactionSetup => ({
      faction, servant_id: sv, master_id: null, controller, tile: 'tl_r2c2', condition: 'full', mana: 0, seals: 3, fate_points: 3, affinity: controller === 'player' ? 35 : null,
    });
    log.emit('run_started', [], { seed: 1, player: 'fc_player', summon: 'random', factions: [fs('fc_player', SV.artoria, 'player'), fs('fc_e1', SV.cu, 'ai')] });
    log.emit('battle_started', ['fc_player', 'fc_e1'], { battle_id: 'bt_001', tile: 'tl_r2c2', terrain: 'urban', is_final: false, ambusher: null, sides: ['fc_player', 'fc_e1'], underdog: null });
    return log;
  };
  const end = (log: EventLog) =>
    log.emit('battle_ended', ['fc_player', 'fc_e1'], { battle_id: 'bt_001', result: 'win', winner: 'fc_player', loser: 'fc_e1', dead: 'fc_e1', escaped: null, phases: 3 });
  it('위험까지 몰렸다가 이기면 역전승 서술과 대사, 평소 승리 대사는 없다', () => {
    const log = setup();
    log.emit('condition_changed', ['fc_player'], { battle_id: 'bt_001', faction: 'fc_player', from: 'hurt', to: 'danger' });
    end(log);
    const n = new Narrator(data, 3);
    const beats = log.events.map((e) => n.consume(e));
    const ids = beats.at(-1)!.lines.map((l) => l.textId);
    expect(ids.some((t) => t.startsWith('tx_common_comeback_'))).toBe(true);
    expect(ids.some((t) => t.startsWith(`tx_${SV.artoria}_comeback_`))).toBe(true);
    expect(ids.some((t) => t.includes('_victory_'))).toBe(false);
  });
  it('위험 없이 이기면 평소 승리 대사', () => {
    const log = setup();
    end(log);
    const n = new Narrator(data, 3);
    const ids = log.events.map((e) => n.consume(e)).at(-1)!.lines.map((l) => l.textId);
    expect(ids.some((t) => t.includes('_comeback_'))).toBe(false);
    expect(ids.some((t) => t.includes('_victory_'))).toBe(true);
  });
});

describe('정보 공개 서술 (D-158, D-165)', () => {
  const npBeat = (n: Narrator, log: EventLog) => {
    log.emit('np_opened', ['fc_e1'], { battle_id: 'bt_001', phase_index: 1, faction: 'fc_e1', seal: false, mana_before: 80, mana_after: 0 });
    const beats = log.events.map((e) => n.consume(e));
    return beats.at(-1)!;
  };
  it('보구 개방으로 처음 진명이 드러날 때만 진명 공개 나레이션이 나온다 (이미 알면 다시 나오지 않는다)', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const first = npBeat(new Narrator(data, seed), scenario(1));
      const reveal = (l: { textId: string }) => src(l.textId)?.when?.['event.revealed'] === true;
      expect(first.lines.some(reveal), `${seed}`).toBe(true);
      const again = npBeat(new Narrator(data, seed), scenario(2));
      expect(again.lines.some(reveal), `${seed}`).toBe(false);
    }
  });
  it('약점(3단계)을 알게 되면 대상의 캐릭터 상세를 읽어 준다. 진명(2단계)에서는 읽지 않는다', () => {
    const lore = data.servants[SV.cu]!.lore!;
    const beatAt = (level: number) => {
      const log = scenario(level - 1);
      log.emit('intel_gained', ['fc_player', 'fc_e1'], { target: 'fc_e1', level_from: level - 1, level_to: level, result: 'success', cause: 'intel', roll: null, dc: 10 });
      const n = new Narrator(data, 5);
      return log.events.map((e) => n.consume(e)).at(-1);
    };
    const weak = beatAt(INTEL.weakness)!;
    const isLore = (l: { textId: string }) => l.textId.startsWith('tx_common_intel_weakness_');
    const read = weak.lines.find(isLore)!;
    expect(read.speaker).toBe('narrator');
    expect(read.text.endsWith((lore.weakness ?? lore.detail).replace(/\s+/g, ' ').trim())).toBe(true);
    expect(beatAt(INTEL.name)?.lines.some(isLore) ?? false).toBe(false);
  });
});

describe('소환 대사 (D-169 버그 수정)', () => {
  it('자기 소환 대사가 있는 서번트는 진명 가림 조건이 붙어 있어도 클래스 기본값이 아니라 자기 대사가 나온다', () => {
    let checked = 0;
    for (const f of data.servantDialogue) {
      const own = f.tags.summon ?? [];
      if (!own.length || !data.servants[f.speaker]) continue;
      const line = new Narrator(data, 1).summonLine(f.speaker)!;
      expect(line.textId.startsWith(`tx_${f.speaker}_summon_`), `${f.speaker}: ${line.textId}`).toBe(true);
      checked++;
    }
    expect(checked).toBeGreaterThan(300);
  });
});
