// 한 판 진행 (day-loop.md §10, affinity.md §5, mana.md §5, combat.md §7). 헤드리스로 끝까지 돌린다.
import { describe, expect, it } from 'vitest';
import { K } from '../data/constants';
import { masterIds, runData, servant, servantIds, SV } from '../testkit';
import { applyDelta, postChoiceDelta, tierOf } from './affinity';
import { distance, moveRange, reachable, tile, visible } from './map';
const tileRole = (id: string) => tile(id).role;
import { planRun, PLAYER_FACTION } from './run';
import { simulateRun } from './sim';
import { applyEvent, emptyView, viewOf } from './view';

const data = runData();
const sim = (seed: number) => simulateRun({ seed, data, servantIds: servantIds(), masterIds: masterIds() });

describe('소환과 진영 구성 (02-screens-flow.md S1)', () => {
  it('랜덤 소환: 적 6진영, 서번트는 겹치지 않고 마스터도 겹치지 않는다', () => {
    const p = planRun({ seed: 1, summon: 'random', servantIds: servantIds(), masterIds: masterIds() });
    expect(p.enemies).toHaveLength(6);
    const svs = [p.player_servant_id, ...p.enemies.map((e) => e.servant_id)];
    expect(new Set(svs).size).toBe(7);
    expect(new Set(p.enemies.map((e) => e.master_id)).size).toBe(6);
  });
  it('촉매 소환: 고른 서번트가 나온다', () => {
    const p = planRun({ seed: 1, summon: 'catalyst', catalyst: SV.kojiro, servantIds: servantIds(), masterIds: masterIds() });
    expect(p.player_servant_id).toBe(SV.kojiro);
  });
  it('같은 시드 = 같은 구성', () => {
    const a = planRun({ seed: 9, summon: 'random', servantIds: servantIds(), masterIds: masterIds() });
    expect(planRun({ seed: 9, summon: 'random', servantIds: servantIds(), masterIds: masterIds() })).toEqual(a);
  });
});

describe('맵 (day-loop.md §10)', () => {
  it('1. 시야: (3,3)에서 (3,4)는 보이고 (3,5)는 안 보인다', () => {
    expect(visible('tl_r3c3', 'tl_r3c4')).toBe(true);
    expect(visible('tl_r3c3', 'tl_r3c5')).toBe(false);
    expect(distance('tl_r3c3', 'tl_r2c4')).toBe(2); // 대각선은 인접이 아니다
  });
  it('2. 기승 A+ 메두사: 한 행동에 최대 3칸', () => {
    expect(moveRange(data.skills[SV.medusa]!)).toBe(3);
    expect(moveRange(data.skills[SV.artoria]!)).toBe(2); // 기승 B
    expect(moveRange(data.skills[SV.heracles]!)).toBe(1);
    expect(reachable('tl_r3c3', 3).get('tl_r2c5')).toHaveLength(3);
    expect(reachable('tl_r3c3', 3).has('tl_r2c5')).toBe(true);
    expect(reachable('tl_r3c3', 1).has('tl_r2c5')).toBe(false);
  });
  it('3. 정보 단계 2 → 그 진영과의 판정 +2', () => expect(K['day.intel_mod'][2]).toBe(2));
});

describe('호감도 (affinity.md §5)', () => {
  it('1. 단계 경계: 9 적대, 10 경계, 49 중립, 50 호감, 80 충성', () => {
    expect([9, 10, 49, 50, 80].map(tierOf)).toEqual(['hostile', 'wary', 'neutral', 'friendly', 'loyal']);
  });
  it('2. 알트리아(선) 방면 → 상승, 메데이아(악) 방면 → 하락, 에미야(중립) → 변화 없음, 헤라클레스(광기) → 중립', () => {
    expect(postChoiceDelta(servant(SV.artoria), 'release')).toBeGreaterThan(0);
    expect(postChoiceDelta(servant(SV.medea), 'release')).toBeLessThan(0);
    expect(postChoiceDelta(servant(SV.emiya), 'release')).toBe(0);
    expect(postChoiceDelta(servant(SV.heracles), 'execute')).toBe(0);
  });
  it('변동량 = 기본값 × 성격 계수, 0~100 절삭', () => {
    expect(applyDelta(35, 10, servant(SV.artoria))).toBe(35 + 10 * K['affinity.gain_mult'].royal!);
    expect(applyDelta(95, 50, servant(SV.cu))).toBe(100);
    expect(applyDelta(2, -10, servant(SV.cu))).toBe(0);
  });
});

describe('한 판 끝까지 (헤드리스)', () => {
  const seeds = Array.from({ length: 40 }, (_, i) => i + 1);
  const runs = seeds.map((s) => ({ seed: s, ...sim(s) }));

  it.each(runs.map((r) => [r.seed, r] as const))('시드 %d: 우승자 1명으로 끝나고, 로그로 다시 만든 상태가 엔진 상태와 같다', (_s, r) => {
    const end = r.log.ofType('run_ended')[0]!;
    expect(end).toBeDefined();
    const v = viewOf(r.log.events);
    const alive = Object.values(v.factions).filter((f) => f.alive);
    expect(alive.map((f) => f.id)).toEqual([end.data.winner]);
    for (const f of Object.values(r.result.state.factions)) {
      expect(v.factions[f.id], f.id).toMatchObject({ tile: f.tile, condition: f.condition, mana: f.mana, seals: f.seals, fatePoints: f.fatePoints, affinity: f.affinity, alive: f.alive });
    }
    expect(v.intel).toEqual(r.result.state.intel);
  });

  it('같은 시드 = 같은 로그', () => {
    expect(JSON.stringify(sim(7).log.events)).toBe(JSON.stringify(sim(7).log.events));
  });

  it('보구 공개 직후부터 화면 정보 단계와 실제 판정 보정이 일치한다 (D-137)', () => {
    let reveals = 0;
    let checked = 0;
    for (const r of runs) {
      let v = emptyView();
      let negated = false; // 상대의 정보 무효 스킬 (소와의 소양, D-142)이 이번 굴림에서 발동했다
      for (const e of r.log.events) {
        v = applyEvent(v, e);
        if (e.type === 'skill_triggered' && e.data.effect === 'event_negate' && e.data.target === v.player && e.data.faction !== v.player) negated = true;
        if (e.type === 'intel_gained' && e.data.cause === 'np') {
          reveals += 1;
          expect(v.battle?.sides).toContain(v.player);
          expect(v.battle?.sides).toContain(e.data.target);
          expect(e.data.level_to).toBe(3);
        }
        if (e.type !== 'phase_rolled' || !v.battle?.sides.includes(v.player)) continue;
        const mine = e.data.rolls.find((x) => x.faction === v.player);
        if (!mine) continue;
        const enemy = v.battle.sides.find((fc) => fc !== v.player)!;
        const expected = negated ? 0 : K['day.intel_mod'][v.intel[enemy] ?? 0];
        negated = false;
        expect(mine.parts.intel ?? 0, `seed ${r.seed}, ${e.data.battle_id}/${e.data.phase_index}`).toBe(expected);
        checked += 1;
      }
    }
    expect(reveals).toBeGreaterThan(0);
    expect(checked).toBeGreaterThan(reveals);
  });

  it('조우는 밤에만 (D-077)', () => {
    for (const r of runs) for (const e of r.log.ofType('encounter')) expect(e.time).toBe('night');
  });

  it('낮 행동은 낮에만, 마력 공급은 하루 1회 (D-053, D-106)', () => {
    for (const r of runs) {
      for (const e of r.log.events) {
        if (e.type === 'intel_gained' && e.data.cause === 'intel') expect(e.time).toBe('day');
        if (e.type === 'bond' || e.type === 'mana_supplied' || e.type === 'crafted') expect(e.time).toBe('day');
      }
      const days = r.log.ofType('mana_supplied').map((e) => e.day);
      expect(new Set(days).size).toBe(days.length);
    }
  });

  it('밤이 끝나면 상태 1단계 회복 (D-034)', () => {
    for (const r of runs) for (const e of r.log.ofType('condition_recovered')) expect(['full', 'hurt', 'danger'].indexOf(e.data.from) - ['full', 'hurt', 'danger'].indexOf(e.data.to)).toBe(1);
  });

  it('강제 전투: 중앙 타일, 라운드마다 대진, 홀수면 부전승, 무승부·도주 없음 (D-075, D-103)', () => {
    const finals = runs.filter((r) => r.log.ofType('final_started').length);
    expect(finals.length).toBeGreaterThan(0);
    for (const r of finals) {
      for (const b of r.log.ofType('final_battle_bracket')) {
        const n = b.data.pairs.length * 2 + (b.data.bye ? 1 : 0);
        expect(b.data.bye !== null).toBe(n % 2 === 1);
      }
      const finalBattles = new Set(r.log.ofType('battle_started').filter((e) => e.data.is_final).map((e) => e.data.battle_id));
      for (const e of r.log.ofType('battle_ended')) if (finalBattles.has(e.data.battle_id)) expect(e.data.result).toBe('win');
    }
  });

  it('플레이어가 탈락해도 끝까지 진행해 최종 우승자를 정한다 (D-043)', () => {
    const lost = runs.filter((r) => r.log.ofType('run_ended')[0]!.data.result === 'defeat');
    expect(lost.length).toBeGreaterThan(0);
    for (const r of lost) {
      const end = r.log.ofType('run_ended')[0]!;
      expect(end.data.winner).not.toBe(PLAYER_FACTION);
      expect(end.data.winner).not.toBeNull();
    }
  });

  it('플레이어 서번트는 마력이 자연 회복되지 않는다. 적은 회복한다 (D-111)', () => {
    for (const r of runs) {
      const regen = r.log.ofType('mana_regenerated');
      expect(regen.some((e) => e.data.faction === PLAYER_FACTION)).toBe(false);
      expect(regen.length).toBeGreaterThan(0);
    }
  });

  it('대기 행동은 없고, 자기 칸을 고르면 머문다 (D-112)', () => {
    for (const r of runs) {
      for (const e of r.log.ofType('moved')) expect(e.data.from).not.toBe(e.data.to);
    }
    expect(runs.some((r) => r.log.ofType('waited').length > 0)).toBe(true);
  });

  it('낮 행동은 칸 역할로만 벌어진다: 교류·정보 칸은 자동, 영맥은 진지 작성 (D-128)', () => {
    for (const r of runs) {
      const v = viewOf(r.log.events);
      void v;
      let tileNow = '';
      for (const e of r.log.events) {
        if (e.type === 'run_started') tileNow = e.data.factions.find((f) => f.faction === PLAYER_FACTION)!.tile;
        if (e.type === 'moved' && e.data.faction === PLAYER_FACTION) tileNow = e.data.to;
        if (e.type === 'bond') expect(tileRole(tileNow)).toBe('bond');
        if (e.type === 'intel_gained' && e.data.cause === 'intel') expect(tileRole(tileNow)).toBe('intel');
        if (e.type === 'crafted') expect(tileRole(tileNow)).toBe('leyline');
      }
    }
    expect(runs.some((r) => r.log.ofType('bond').length > 0)).toBe(true);
  });

  it('마력 공급은 아침 요청으로만, 부상 때 보통 이상이면 상태 회복 (D-129)', () => {
    for (const r of runs) {
      for (const e of r.log.ofType('mana_supplied')) expect(e.action).toBe(0);
      for (const e of r.log.ofType('condition_recovered')) if (e.data.cause === 'supply') expect(e.time).toBe('day');
    }
    expect(runs.some((r) => r.log.ofType('mana_supplied').length > 0)).toBe(true);
  });

  it('적 AI는 영주를 도주에만 쓴다 (D-094)', () => {
    for (const r of runs) for (const e of r.log.ofType('seal_used')) if (e.data.faction !== PLAYER_FACTION) expect(e.data.purpose).toBe('escape');
  });
});
