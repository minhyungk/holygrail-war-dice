// 한 판 진행 (day-loop.md §10, affinity.md §5, mana.md §5, combat.md §7). 헤드리스로 끝까지 돌린다.
import { describe, expect, it } from 'vitest';
import { K } from '../data/constants';
import { masterIds, runData, servant, servantIds, SV } from '../testkit';
import { EXTRA_CLASSES, type Reaction, STANDARD_CLASSES } from '../data/schema';
import { applyDelta, postChoiceDelta, reactionDelta, tierOf } from './affinity';
import { distance, moveRange, reachable, tile, visible } from './map';
const tileRole = (id: string) => tile(id).role;
import { planRun, PLAYER_FACTION } from './run';
import { simulateRun } from './sim';
import { applyEvent, emptyView, viewOf } from './view';

const data = runData();
const sim = (seed: number) => simulateRun({ seed, data, servantIds: servantIds(), masterIds: masterIds() });

describe('소환과 진영 구성 (02-screens-flow.md S1)', () => {
  it('랜덤 소환: 적 6진영, 서번트는 겹치지 않고 마스터도 겹치지 않는다', () => {
    const p = planRun({ seed: 1, summon: 'random', servants: Object.values(data.servants), masterIds: masterIds() });
    expect(p.enemies).toHaveLength(6);
    const svs = [p.player_servant_id, ...p.enemies.map((e) => e.servant_id)];
    expect(new Set(svs).size).toBe(7);
    expect(new Set(p.enemies.map((e) => e.master_id)).size).toBe(6);
  });
  it('촉매 소환: 고른 서번트가 나온다', () => {
    const p = planRun({ seed: 1, summon: 'catalyst', catalyst: SV.kojiro, servants: Object.values(data.servants), masterIds: masterIds() });
    expect(p.player_servant_id).toBe(SV.kojiro);
  });
  it('정규 7클래스에서 클래스당 1기, 난입 소환이면 한 자리를 엑스트라 클래스가 대체한다 (D-157)', () => {
    let irregular = 0;
    const N = 400;
    for (let seed = 1; seed <= N; seed++) {
      const p = planRun({ seed, summon: 'random', servants: Object.values(data.servants), masterIds: masterIds() });
      const cls = [p.player_servant_id, ...p.enemies.map((e) => e.servant_id)].map((id) => data.servants[id]!.class);
      expect(cls).toHaveLength(7);
      const std = cls.filter((c) => (STANDARD_CLASSES as readonly string[]).includes(c));
      expect(new Set(std).size).toBe(std.length);
      if (p.irregular) {
        irregular++;
        expect(std).toHaveLength(6);
        expect(std).not.toContain(p.irregular.replaced_class);
        expect((EXTRA_CLASSES as readonly string[]).includes(data.servants[p.irregular.servant_id]!.class)).toBe(true);
      } else expect(std).toHaveLength(7);
    }
    // 확률 run.extra_class_chance (0.2) 근처
    expect(Math.abs(irregular / N - K['run.extra_class_chance'])).toBeLessThan(0.06);
  });
  it('촉매로 엑스트라 클래스를 고르면 반드시 난입 소환이고, 정규 클래스를 고르면 그 클래스 자리는 플레이어 몫이다', () => {
    const extra = Object.values(data.servants).find((s) => (EXTRA_CLASSES as readonly string[]).includes(s.class))!;
    for (let seed = 1; seed <= 20; seed++) {
      const p = planRun({ seed, summon: 'catalyst', catalyst: extra.servant_id, servants: Object.values(data.servants), masterIds: masterIds() });
      expect(p.irregular?.servant_id).toBe(extra.servant_id);
      const q = planRun({ seed, summon: 'catalyst', catalyst: SV.kojiro, servants: Object.values(data.servants), masterIds: masterIds() });
      expect(q.enemies.map((e) => data.servants[e.servant_id]!.class)).not.toContain('assassin');
    }
  });
  it('같은 시드 = 같은 구성', () => {
    const a = planRun({ seed: 9, summon: 'random', servants: Object.values(data.servants), masterIds: masterIds() });
    expect(planRun({ seed: 9, summon: 'random', servants: Object.values(data.servants), masterIds: masterIds() })).toEqual(a);
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
  it('3. 정보 단계 2(진명) → 그 진영과의 판정 +0.5, 3단계(약점) → +1, 얼굴(1단계)은 보정 없음 (D-158, D-159)', () => expect(K['day.intel_mod']).toEqual([0, 0, 0.5, 1]));
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
  it('선택 반응 (§3.6, D-150): 성격 표, 서번트 예외가 우선', () => {
    expect(reactionDelta(servant(SV.artoria), 'danger_run')).toBe(K['affinity.reaction'].royal!.danger_run);
    expect(reactionDelta(servant(SV.kojiro), 'encounter_fight')).toBe(2); // 성격(assassin) 표는 -1이지만 예외가 우선
    expect(K['affinity.reaction'].assassin!.encounter_fight).toBe(-1);
    expect(reactionDelta(servant(SV.kojiro), 'danger_seal')).toBe(K['affinity.reaction'].assassin!.danger_seal); // 예외에 없는 선택은 성격 표
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
          expect(e.data.level_to).toBe(2); // 보구 개방은 진명까지 (D-158)
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
        if (e.type === 'bond' || e.type === 'mana_supplied') expect(e.time).toBe('day');
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

  it('하루 = 낮 메뉴 1회 + 밤 이동 2회, 낮에는 이동하지 않는다 (D-145)', () => {
    for (const r of runs) {
      for (const e of r.log.events) {
        if (e.type === 'moved' && e.data.faction === PLAYER_FACTION) expect(e.time).toBe('night');
        if (e.time === 'night' && e.type !== 'condition_recovered' && e.type !== 'betrayal_attempted' && e.type !== 'betrayal_blocked' && e.type !== 'seal_used' && e.type !== 'eliminated')
          expect(e.action).toBeLessThanOrEqual(K['day.actions_night']);
        if (e.type === 'action_started' && e.data.action !== 'supply') expect([e.time, e.action]).toEqual(['day', 1]);
      }
    }
    expect(runs.some((r) => r.log.ofType('bond').length > 0)).toBe(true);
    expect(runs.some((r) => r.log.ofType('intel_gained').some((e) => e.data.cause === 'intel'))).toBe(true);
  });

  it('칸 보너스: 밤을 마친 칸의 역할이 그날 판정에 더해진다 (D-145)', () => {
    let seen = 0;
    for (const r of runs) {
      let tileNow = '';
      for (const e of r.log.events) {
        if (e.type === 'run_started') tileNow = e.data.factions.find((f) => f.faction === PLAYER_FACTION)!.tile;
        if (e.type === 'moved' && e.data.faction === PLAYER_FACTION) tileNow = e.data.to;
        const bonus = K['day.role_bonus'];
        if (e.type === 'bond') expect(e.data.roll.parts.role ?? 0).toBe(tileRole(tileNow) === 'bond' ? bonus.bond : 0);
        if (e.type === 'intel_gained' && e.data.cause === 'intel') expect(e.data.roll!.parts.role ?? 0).toBe(tileRole(tileNow) === 'intel' ? bonus.intel : 0);
        if (e.type === 'mana_supplied') {
          expect(e.data.roll.parts.leyline ?? 0).toBe(tileRole(tileNow) === 'leyline' ? bonus.leyline : 0);
          if (e.data.roll.parts.leyline) seen += 1;
        }
      }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('낮 판정은 자동: 운명점 재굴림이 없다 (D-145)', () => {
    for (const r of runs) {
      for (const e of r.log.ofType('bond')) expect(e.data.roll.rerolls).toBe(0);
      for (const e of r.log.ofType('intel_gained')) if (e.data.roll) expect(e.data.roll.rerolls).toBe(0);
    }
  });

  it('진지는 없다 (D-146)', () => {
    for (const r of runs) for (const e of r.log.events) expect(['crafted', 'camp_offer']).not.toContain(e.type);
  });

  it('마력 공급은 아침 요청으로만, 부상 때 보통 이상이면 상태 회복 (D-129)', () => {
    for (const r of runs) {
      for (const e of r.log.ofType('mana_supplied')) expect(e.action).toBe(0);
      for (const e of r.log.ofType('condition_recovered')) if (e.data.cause === 'supply') expect(e.time).toBe('day');
    }
    expect(runs.some((r) => r.log.ofType('mana_supplied').length > 0)).toBe(true);
  });

  it('조우하면 상대 클래스를 안다 (D-147)', () => {
    let n = 0;
    for (const r of runs) {
      let v = emptyView();
      for (const e of r.log.events) {
        v = applyEvent(v, e);
        if (e.type === 'encounter' && e.data.factions.includes(PLAYER_FACTION)) {
          const enemy = e.data.factions.find((f) => f !== PLAYER_FACTION)!;
          expect(v.intel[enemy], `seed ${r.seed}`).toBeGreaterThanOrEqual(0);
          n += 1;
        }
        if (e.type === 'encounter_decided' && Object.keys(e.data.choices).includes(PLAYER_FACTION)) {
          const enemy = Object.keys(e.data.choices).find((f) => f !== PLAYER_FACTION)!;
          expect(v.intel[enemy], `seed ${r.seed}`).toBeGreaterThanOrEqual(1);
        }
      }
    }
    expect(n).toBeGreaterThan(0);
  });

  it('결판 없는 플레이어 전투(무승부·적 도주)는 그 적 정보 +1단계 (D-147)', () => {
    let n = 0;
    for (const r of runs) {
      const ev = r.log.events;
      for (let k = 0; k < ev.length; k++) {
        const e = ev[k]!;
        if (e.type !== 'battle_ended' || !r.log.ofType('battle_started').find((b) => b.data.battle_id === e.data.battle_id)!.data.sides.includes(PLAYER_FACTION)) continue;
        const enemy = r.log.ofType('battle_started').find((b) => b.data.battle_id === e.data.battle_id)!.data.sides.find((f) => f !== PLAYER_FACTION)!;
        const noVerdict = e.data.result === 'draw' || (e.data.result === 'escape' && e.data.escaped === enemy);
        const next = ev[k + 1];
        const gained = next?.type === 'intel_gained' && next.data.cause === 'battle' && next.data.target === enemy;
        if (!noVerdict) expect(gained).toBe(false);
        if (gained) {
          n += 1;
          expect(next.data.level_to).toBe(next.data.level_from + 1);
        }
      }
    }
    expect(n).toBeGreaterThan(0);
  });

  it('적 AI의 영주 퇴각은 진영당 판 ai.seal_retreat_max회 (D-149)', () => {
    for (const r of runs) {
      const count: Record<string, number> = {};
      for (const e of r.log.ofType('seal_used')) if (e.data.faction !== PLAYER_FACTION && e.data.purpose === 'escape') count[e.data.faction] = (count[e.data.faction] ?? 0) + 1;
      for (const c of Object.values(count)) expect(c).toBeLessThanOrEqual(K['ai.seal_retreat_max']);
    }
  });

  it('선택에 대한 호감도 반응은 표 값을 그대로 더한다 (D-150)', () => {
    let n = 0;
    for (const r of runs) {
      const sv = r.result.state.factions[PLAYER_FACTION]!.servant;
      for (const e of r.log.ofType('affinity_changed')) {
        if (!e.data.cause.startsWith('react:')) continue;
        const d = reactionDelta(sv, e.data.cause.slice(6) as Reaction);
        expect(e.data.to).toBe(Math.min(100, Math.max(0, e.data.from + d)));
        n += 1;
      }
    }
    expect(n).toBeGreaterThan(0);
  });

  it('적 AI는 영주를 도주에만 쓴다 (D-094)', () => {
    for (const r of runs) for (const e of r.log.ofType('seal_used')) if (e.data.faction !== PLAYER_FACTION) expect(e.data.purpose).toBe('escape');
  });
});

describe('상태 회복 시점 (combat.md §3.4-6, D-167)', () => {
  it('밤에 들어갈 때만 회복한다: 밤에 다치면 다음 날 낮은 그대로, 그다음 밤 시작에 1단계', () => {
    let nights = 0;
    for (let seed = 1; seed <= 30; seed++) {
      const { log } = sim(seed);
      for (const e of log.ofType('condition_recovered')) {
        if (e.data.cause !== 'night') continue;
        nights++;
        expect([e.time, e.action], `${seed} ${e.seq}`).toEqual(['night', 0]);
        // 회복 직전 이벤트들은 같은 날 밤의 시작(night_started)이다
        const start = log.events.filter((x) => x.seq < e.seq && x.type === 'night_started').at(-1)!;
        expect(start.day).toBe(e.day);
        expect(e.day).toBeGreaterThan(1);
      }
      // 낮에는 밤 회복이 없다
      expect(log.ofType('condition_recovered').some((x) => x.data.cause === 'night' && x.time === 'day')).toBe(false);
    }
    expect(nights).toBeGreaterThan(0);
  });
});

describe('기적은 전투 국면 판정의 약자만 (dice.md §3.4, D-166, D-167)', () => {
  it('마력 공급·낮 행동·도주 판정에는 기적이 없고, 국면 기적은 약자 쪽에서만 나온다', () => {
    let phaseMiracles = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const { log } = sim(seed);
      for (const e of log.ofType('mana_supplied')) expect(e.data.roll.miracle).toBe(false);
      for (const e of log.ofType('escape_attempted')) for (const r of e.data.rolls) expect(r.miracle).toBe(false);
      const underdog = new Map(log.ofType('battle_started').map((b) => [b.data.battle_id, b.data.underdog]));
      for (const e of log.ofType('phase_rolled')) {
        for (const r of e.data.rolls) {
          if (!r.miracle) continue;
          phaseMiracles++;
          expect(r.faction, `${seed} ${e.data.battle_id}`).toBe(underdog.get(e.data.battle_id));
        }
      }
    }
    expect(phaseMiracles).toBeGreaterThan(0);
  });
});
