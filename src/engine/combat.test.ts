// docs/systems/combat.md §11, phases.md §5 예시 3~6
// 추첨값: 국면 추첨(0~99, 누적 가중치) 다음에 공격측(0=a, 1=b). 보구 국면이면 국면 추첨이 없다.
// 확률 판정(적 AI의 보구 개방·위험 퇴각, 명령 거부)은 0~9999 추첨: 확률×10000보다 작으면 일어난다. 9999 = 일어나지 않음
import { describe, expect, it } from 'vitest';
import { scriptedDice, servant, SV } from '../testkit';
import { type BattleInput, createFighter, type Fighter, type Policy, type Prompt, runBattle } from './combat';
import { EventLog } from './events';

/** 기본 정책: 지시 없음, 위험에서는 버틴다, 재굴림 안 함 */
const noReroll: Policy = (p) => {
  if (p.kind === 'phase_command') return 'none';
  if (p.kind === 'danger_decision') return 'fight';
  return false;
};
const NO = 9999; // 확률 판정: 일어나지 않음
const fighter = (faction: string, id: string, controller: Fighter['controller'], o: Partial<Fighter> = {}) =>
  createFighter(faction, servant(id), controller, { mana: 0, ...o }); // 예시는 보구 미개방 가정

function run(input: Omit<BattleInput, 'battleId'>, rolls: number[], draws: number[], policy: Policy = noReroll) {
  const dice = scriptedDice(rolls, draws);
  const log = new EventLog();
  const prompts: Prompt[] = [];
  const out = runBattle({ battleId: 'bt_test', ...input }, dice, log, (p) => (prompts.push(p), policy(p)));
  expect(dice.remaining()).toEqual({ rolls: 0, draws: 0 });
  const totals = log.ofType('phase_rolled').map((e) => e.data.rolls.map((r) => r.total));
  const conditions = log.ofType('condition_changed').map((e) => `${e.data.faction}:${e.data.from}>${e.data.to}`);
  return { out, log, prompts, totals, conditions };
}

describe('combat.md §11 예시', () => {
  it('1. 강자 우세, 무승부: 헤라클레스 vs 메데이아(플레이어), 개활지', () => {
    const r = run(
      { a: fighter('fc_h', SV.heracles, 'ai'), b: fighter('fc_m', SV.medea, 'player'), terrain: 'open' },
      [7, 8, 4, 9, 6, 5],
      [37, 0, 55, 0, 10, 0],
    );
    expect(r.totals).toEqual([[21.5, 15], [11, 14], [20.5, 12]]);
    expect(r.log.ofType('phase_resolved').map((e) => e.data.drop)).toEqual([1, 1, 1]);
    expect(r.conditions).toEqual(['fc_m:full>hurt', 'fc_h:full>hurt', 'fc_m:hurt>danger']);
    expect(r.out.result).toBe('draw');
    expect([r.out.a.condition, r.out.b.condition]).toEqual(['hurt', 'danger']);
  });

  it('2. 약자 승 (기적): 코지로(플레이어) vs 헤라클레스(영주 0), 시가지', () => {
    const r = run(
      { a: fighter('fc_k', SV.kojiro, 'player'), b: fighter('fc_h', SV.heracles, 'ai', { seals: 0 }), terrain: 'urban' },
      [9, 6, 12, 7, 8, 6],
      [30, 0, 5, 0, NO, 40, 0], // 국면 2 뒤 헤라클레스가 위험에 들어서며 버틴다
    );
    expect(r.totals).toEqual([[16.5, 13], [23, 21.5], [15.5, 13]]);
    expect(r.log.ofType('phase_rolled')[1]!.data.rolls[0]!.miracle).toBe(true);
    expect(r.conditions).toEqual(['fc_h:full>hurt', 'fc_h:hurt>danger', 'fc_h:danger>dead']);
    expect(r.out).toMatchObject({ result: 'win', winner: 'fc_k', dead: 'fc_h', phases: 3 });
  });

  const ex3 = { rolls: [7, 8, 9, 6, 4, 7], draws: [0, 0, 40, 0, 0, 0] };
  it('3. 무승부: 알트리아 vs 쿠 훌린, 수변 (국면 1 동점 스킵)', () => {
    const r = run({ a: fighter('fc_a', SV.artoria, 'ai'), b: fighter('fc_c', SV.cu, 'ai'), terrain: 'river' }, ex3.rolls, ex3.draws);
    expect(r.totals).toEqual([[19, 19], [15, 13], [16, 18]]);
    expect(r.log.ofType('phase_resolved')[0]!.data.skipped).toBe(true);
    expect(r.conditions).toEqual(['fc_c:full>hurt', 'fc_a:full>hurt']);
    expect(r.out).toMatchObject({ result: 'draw', phases: 3 });
  });

  it('4. 강제 전투: 3번이 강제 전투면 국면 4부터 이어서 싸운다 (D-075)', () => {
    const r = run(
      { a: fighter('fc_a', SV.artoria, 'ai'), b: fighter('fc_c', SV.cu, 'ai'), terrain: 'river', isFinal: true },
      [...ex3.rolls, 10, 3, 8, 5],
      [...ex3.draws, 40, 0, 0, 0],
    );
    expect(r.totals.slice(3)).toEqual([[16, 10], [20, 16]]);
    expect(r.conditions.slice(2)).toEqual(['fc_c:hurt>danger', 'fc_c:danger>dead']);
    expect(r.out).toMatchObject({ result: 'win', winner: 'fc_a', dead: 'fc_c', phases: 5 });
  });

  it('5. 2단계 하락: 24.5 ≥ 11 × 2 → 메데이아 만전 → 위험 (D-092)', () => {
    const r = run(
      { a: fighter('fc_h', SV.heracles, 'ai'), b: fighter('fc_m', SV.medea, 'ai'), terrain: 'open' },
      [10, 4, 2, 4, 2, 4],
      [0, 0, NO, 55, 0, 55, 0], // 메데이아는 위험에 들어서며 버틴다
    );
    expect(r.totals[0]).toEqual([24.5, 11]);
    expect(r.log.ofType('phase_resolved')[0]!.data.drop).toBe(2);
    expect(r.conditions).toEqual(['fc_m:full>danger']);
  });

  describe('6. 위험에 들어섰을 때 (D-134): 메데이아(플레이어, 영주 3)가 부상에서 국면 패배', () => {
    // 국면 1 정면 격돌: 헤라클레스 14.5 + 7 = 21.5 / 메데이아 7 + 8 = 15 → 메데이아 부상 → 위험
    const input = () => ({ a: fighter('fc_h', SV.heracles, 'ai'), b: fighter('fc_m', SV.medea, 'player', { condition: 'hurt' as const }), terrain: 'open' as const });
    const choose = (c: 'fight' | 'seal' | 'run'): Policy => (p) => (p.kind === 'danger_decision' ? c : p.kind === 'phase_command' ? 'none' : false);

    it('위험에 들어서는 순간 묻는다: 계속 싸운다 / 영주로 퇴각 / 일반 도주', () => {
      const r = run(input(), [7, 8], [0, 0], choose('seal'));
      expect(r.prompts.find((p) => p.kind === 'danger_decision')).toEqual({ kind: 'danger_decision', faction: 'fc_m', options: ['fight', 'seal', 'run'], seals: 3 });
    });
    it('영주로 퇴각 → 영주 3 → 2, 전투 결과 도주', () => {
      const r = run(input(), [7, 8], [0, 0], choose('seal'));
      expect(r.log.ofType('seal_used')[0]!.data).toMatchObject({ purpose: 'escape', seals_left: 2 });
      expect(r.out).toMatchObject({ result: 'escape', escaped: 'fc_m' });
    });
    it('일반 도주 성공: 15 vs 13 → 이탈', () => {
      const r = run(input(), [7, 8, 6, 10], [0, 0], choose('run'));
      expect(r.log.ofType('escape_attempted')[0]!.data.rolls.map((x) => x.total)).toEqual([13, 15]);
      expect(r.out).toMatchObject({ result: 'escape', escaped: 'fc_m' });
    });
    it('일반 도주 실패: 11 vs 22 → 전쟁 패배', () => {
      const r = run(input(), [7, 8, 12, 6], [0, 0], choose('run'));
      expect(r.out).toMatchObject({ result: 'escape_failed', loser: 'fc_m', winner: 'fc_h' });
    });
    it('일반 도주 동점은 성공 (D-100)', () => {
      const r = run(input(), [7, 8, 8, 10], [0, 0], choose('run'));
      expect(r.out).toMatchObject({ result: 'escape', escaped: 'fc_m' });
    });
    it('계속 싸우다가 위험에서 또 맞으면 쓰러진다', () => {
      const r = run(input(), [7, 8, 7, 8], [0, 0, 0, 0], choose('fight'));
      expect(r.conditions).toEqual(['fc_m:hurt>danger', 'fc_m:danger>dead']);
      expect(r.out).toMatchObject({ result: 'win', dead: 'fc_m', phases: 2 });
    });
    it('일반 도주를 거부하면 물러나지 못하고 계속 싸운다 (D-083)', () => {
      // 국면 2 선제: 헤라클레스 7 + 2 = 9 / 메데이아 5 + 10 = 15, 국면 3 동점
      const r = run({ ...input(), b: fighter('fc_m', SV.medea, 'player', { condition: 'hurt', refusal: 0.4 }) }, [7, 8, 2, 10, 2, 4], [0, 0, 100, 55, 0, 55, 0], choose('run'));
      expect(r.log.ofType('refused')[0]!.data.command).toBe('escape');
      expect(r.out.result).toBe('draw');
    });
    it('영주 0획이면 계속 싸운다 / 일반 도주', () => {
      const r = run({ ...input(), b: fighter('fc_m', SV.medea, 'player', { condition: 'hurt', seals: 0 }) }, [7, 8, 6, 10], [0, 0], choose('run'));
      expect(r.prompts.find((p) => p.kind === 'danger_decision')).toMatchObject({ options: ['fight', 'run'] });
    });
    it('2단계 하락으로 위험을 건너뛰면 위험에서 멈추고 묻는다', () => {
      // 헤라클레스 14.5 + 10 = 24.5 ≥ 11 × 2
      const r = run(input(), [10, 4], [0, 0], choose('seal'));
      expect(r.conditions).toEqual(['fc_m:hurt>danger']);
      expect(r.log.ofType('phase_resolved')[0]!.data.condition_to).toBe('danger');
      expect(r.prompts.some((p) => p.kind === 'danger_decision')).toBe(true);
    });
    it('강제 전투에서는 묻지 않고, 위험에서 맞으면 쓰러진다 (§7-4)', () => {
      const r = run({ ...input(), isFinal: true }, [7, 8, 7, 8], [0, 0, 0, 0]);
      expect(r.prompts.filter((p) => p.kind === 'danger_decision')).toHaveLength(0);
      expect(r.out).toMatchObject({ result: 'win', dead: 'fc_m' });
    });
    it('적 AI는 마스터 성향으로 정한다: 퇴각이면 영주, 영주가 없으면 일반 도주. 버티면 다음에 쓰러질 수 있다', () => {
      const ai = (o: Partial<Fighter>) => fighter('fc_m', SV.medea, 'ai', { condition: 'hurt', ...o });
      expect(run({ ...input(), b: ai({}) }, [7, 8], [0, 0, 0]).out).toMatchObject({ result: 'escape', escaped: 'fc_m' });
      expect(run({ ...input(), b: ai({ seals: 0 }) }, [7, 8, 6, 10], [0, 0, 0]).out).toMatchObject({ result: 'escape', escaped: 'fc_m' });
      expect(run({ ...input(), b: ai({}) }, [7, 8, 7, 8], [0, 0, NO, 0, 0]).out).toMatchObject({ result: 'win', dead: 'fc_m' });
      // 호전 10%: 2000은 버틴다, 신중 90%: 2000이면 퇴각
      expect(run({ ...input(), b: ai({ temperament: 'aggressive' }) }, [7, 8, 7, 8], [0, 0, 2000, 0, 0]).out.dead).toBe('fc_m');
      expect(run({ ...input(), b: ai({ temperament: 'cautious' }) }, [7, 8], [0, 0, 2000]).out.escaped).toBe('fc_m');
    });
  });
});

describe('보구 개방 (phases.md §5-3, §3.6)', () => {
  it('숲, 알트리아(AI, 마력 80) 개방 → 일방 보구, 보구 8 vs 쿠 훌린 내구 5', () => {
    const r = run(
      { a: fighter('fc_a', SV.artoria, 'ai', { mana: 80 }), b: fighter('fc_c', SV.cu, 'ai', { mana: 0 }), terrain: 'forest' },
      [10, 10, 2, 3, 2, 3],
      [0, 0, 0, 0, 0], // 국면 1: 적 AI 보구 판정(0 = 연다)만, 국면 추첨 없음
    );
    expect(r.log.ofType('np_opened')[0]!.data).toMatchObject({ faction: 'fc_a', mana_before: 80, mana_after: 0 });
    expect(r.log.ofType('phase_started')[0]!.data).toMatchObject({ phase_id: 'ph_np_attack', attacker: 'fc_a' });
    expect(r.log.ofType('phase_rolled')[0]!.data.rolls.map((x) => x.total - x.natural)).toEqual([8, 5]);
    expect(r.out.a.mana).toBe(0);
  });
  it('양측 개방 → 보구 격돌. 한쪽이 열면 적 AI는 따라서 연다 (D-136)', () => {
    const r = run(
      { a: fighter('fc_a', SV.artoria, 'ai', { mana: 80 }), b: fighter('fc_h', SV.heracles, 'ai', { mana: 80 }), terrain: 'open' },
      [10, 11, 3, 2, 3, 2], // 보구 8 + 10 = 7 + 11 동점, 국면 2·3 선제 동점
      [0, NO, 0, 55, 0, 55, 0], // 알트리아 연다, 헤라클레스는 스스로는 안 열지만 따라서 연다
    );
    expect(r.log.ofType('np_opened').map((e) => e.data.faction)).toEqual(['fc_a', 'fc_h']);
    expect(r.log.ofType('phase_started')[0]!.data.phase_id).toBe('ph_np_clash');
  });
  it('적 AI는 함부로 열지 않는다 (확률이 낮다)', () => {
    const r = run(
      { a: fighter('fc_a', SV.artoria, 'ai', { mana: 80 }), b: fighter('fc_c', SV.cu, 'ai'), terrain: 'open' },
      [3, 2, 3, 2, 3, 2],
      [NO, 55, 0, NO, 55, 0, NO, 55, 0],
    );
    expect(r.log.ofType('np_opened')).toHaveLength(0);
  });
  it('보구는 전투당 1회, 마력 80 (D-135)', () => {
    const r = run(
      { a: fighter('fc_a', SV.artoria, 'player', { mana: 100, fatePoints: 0 }), b: fighter('fc_c', SV.cu, 'ai'), terrain: 'open' },
      [2, 5, 3, 2, 3, 2], // 보구 8 + 2 = 10 vs 내구 5 + 5 = 10 → 동점
      [55, 0, 55, 0],
      (p) => (p.kind === 'phase_command' ? (p.phase_index === 1 ? 'np' : 'none') : false),
    );
    expect(r.log.ofType('np_opened')[0]!.data).toMatchObject({ mana_before: 100, mana_after: 20 });
    const later = r.prompts.filter((p) => p.kind === 'phase_command' && p.phase_index > 1);
    expect(later.every((p) => p.kind === 'phase_command' && !p.options.includes('np') && !p.options.includes('seal_np'))).toBe(true);
  });
  it('플레이어는 마력 80 이상일 때 개입 지점에서 고른다. 보류하면 지형 추첨', () => {
    const r = run(
      { a: fighter('fc_a', SV.artoria, 'player', { mana: 80, fatePoints: 0 }), b: fighter('fc_c', SV.cu, 'ai'), terrain: 'open' },
      [3, 2, 3, 2, 3, 2], // 선제/회피 6 + 3 = 7 + 2 → 동점
      [50, 0, 50, 0, 50, 0],
    );
    const asks = r.prompts.filter((p) => p.kind === 'phase_command');
    expect(asks).toHaveLength(3);
    expect(asks.every((p) => p.kind === 'phase_command' && p.options.includes('np'))).toBe(true);
    expect(r.log.ofType('np_opened')).toHaveLength(0);
  });
  it('적 AI가 먼저 보구를 열고, 플레이어에게 맞설지 묻는다. 마력으로도 열 수 있다 (D-113, D-127)', () => {
    const r = run(
      { a: fighter('fc_a', SV.artoria, 'player', { mana: 80, fatePoints: 0, seals: 0 }), b: fighter('fc_h', SV.heracles, 'ai', { mana: 80 }), terrain: 'open' },
      [3, 7, 3, 5, 3, 5], // 진명 공개 즉시 정보 +3: 보구 격돌과 다음 선제 국면 모두 동점
      [0, 0, 50, 0, 50, 0], // 국면 1: 적 AI 보구 판정(0 = 연다), 보구 격돌 공격측 추첨
      (p) => (p.kind === 'phase_command' ? (p.phase_index === 1 ? 'np' : 'none') : false),
    );
    const first = r.prompts.find((p) => p.kind === 'phase_command')!;
    expect(first).toMatchObject({ enemy_np: true, options: ['np'] });
    expect(r.log.ofType('np_opened').map((e) => e.data.faction)).toEqual(['fc_h', 'fc_a']);
    expect(r.log.ofType('phase_started')[0]!.data.phase_id).toBe('ph_np_clash');
  });
  it('마력 80 미만이면 마력 보구 개방은 선택지에 없다 (영주 선택지만)', () => {
    const r = run(
      { a: fighter('fc_a', SV.artoria, 'player', { mana: 79, fatePoints: 0 }), b: fighter('fc_c', SV.cu, 'ai'), terrain: 'open' },
      [3, 2, 3, 2, 3, 2], // 선제/회피 6 + 3 = 7 + 2 → 동점
      [50, 0, 50, 0, 50, 0],
    );
    const asks = r.prompts.filter((p) => p.kind === 'phase_command');
    expect(asks.length).toBe(3);
    expect(asks.every((p) => p.kind === 'phase_command' && !p.options.includes('np') && p.options.includes('seal_np'))).toBe(true);
  });
});

describe('즉사/우연 (phases.md §5-4 ~ 6, D-097)', () => {
  // 숲: 정면 0~19, 선제 20~49, 마술 50~89, 즉사 90~99. 국면 2·3은 동점으로 스킵
  const tail = { rolls: [2, 3, 2, 3], draws: [0, 0, 0, 0] };
  const fate = (defenderNatural: number) =>
    run(
      { a: fighter('fc_a', SV.artoria, 'ai'), b: fighter('fc_c', SV.cu, 'ai'), terrain: 'forest' },
      [defenderNatural, ...tail.rolls],
      [95, 0, ...tail.draws],
    );
  it('4. 방어측 쿠 훌린 행운 3 + 5 = 8 < 9 → 실패, 만전 → 부상', () => {
    const r = fate(5);
    expect(r.log.ofType('phase_rolled')[0]!.data).toMatchObject({ kind: 'solo', dc: 9 });
    expect(r.totals[0]).toEqual([8]);
    expect(r.conditions).toEqual(['fc_c:full>hurt']);
  });
  it('5. 방어측 알트리아 7.5 + 2 = 9.5 → 성공, 국면 스킵', () => {
    const r = run(
      { a: fighter('fc_c', SV.cu, 'ai'), b: fighter('fc_a', SV.artoria, 'ai'), terrain: 'forest' },
      [2, 3, 2, 3, 2], // 국면 2·3 정면 격돌: 쿠 훌린 11 + 3 = 알트리아 12 + 2 → 동점
      [95, 0, ...tail.draws],
    );
    expect(r.totals[0]).toEqual([9.5]);
    expect(r.log.ofType('phase_resolved')[0]!.data.skipped).toBe(true);
  });
  it('6. 쿠 훌린 자연값 12 → 기적 +3 → 18 → 성공', () => {
    const r = fate(12);
    expect(r.totals[0]).toEqual([18]);
    expect(r.log.ofType('phase_resolved')[0]!.data.skipped).toBe(true);
  });
});

describe('운명점 재굴림 (dice.md §3.5)', () => {
  it('재굴림하면 운명점 1 소모, 새 굴림을 쓴다. 한 판정에서 여러 번 가능', () => {
    let asked = 0;
    const r = run(
      { a: fighter('fc_h', SV.heracles, 'ai'), b: fighter('fc_m', SV.medea, 'player', { fatePoints: 3 }), terrain: 'open' },
      [7, 2, 3, 12, 2, 3, 2, 3],
      [0, 0, 55, 0, 55, 0],
      (p) => (p.kind === 'phase_command' ? 'none' : p.kind === 'danger_decision' ? 'fight' : p.kind === 'reroll' && p.context === 'phase' && ++asked <= 2),
    );
    expect(r.log.ofType('phase_rolled')[0]!.data.rolls[1]).toMatchObject({ natural: 12, rerolls: 2 });
    expect(r.out.b.fatePoints).toBe(1);
  });
  it('운명점 0이면 묻지 않는다', () => {
    const r = run(
      { a: fighter('fc_h', SV.heracles, 'ai'), b: fighter('fc_m', SV.medea, 'player', { fatePoints: 0 }), terrain: 'open' },
      [2, 4, 2, 4, 2, 4],
      [55, 0, 55, 0, 55, 0],
    );
    expect(r.prompts.filter((p) => p.kind === 'reroll')).toHaveLength(0);
  });
});

describe('기습 (D-099)', () => {
  it('기습한 쪽이 국면 1의 공격측, 국면 2부터는 추첨', () => {
    const r = run(
      { a: fighter('fc_a', SV.artoria, 'ai'), b: fighter('fc_c', SV.cu, 'ai'), terrain: 'forest', ambusher: 'b' },
      [2, 3, 2, 3, 2, 3],
      [0, 0, 0, 0, 0], // 국면 1: 국면 추첨만, 공격측 추첨 없음
    );
    expect(r.log.ofType('phase_started').map((e) => e.data.attacker)).toEqual(['fc_c', 'fc_a', 'fc_a']);
  });
});

describe('입력 불변', () => {
  it('전투는 입력 Fighter를 바꾸지 않는다', () => {
    const b = fighter('fc_m', SV.medea, 'ai', { condition: 'danger' });
    run({ a: fighter('fc_h', SV.heracles, 'ai'), b, terrain: 'open' }, [7, 8], [0, 0]);
    expect(b.condition).toBe('danger');
    expect(b.seals).toBe(3);
  });
});

describe('영주 명령 (D-101, combat.md §5.1)', () => {
  const sealPolicy = (cmd: 'seal_np', at = 1): Policy => (p) => (p.kind === 'phase_command' ? (p.phase_index === at && p.options.includes(cmd) ? cmd : 'none') : false);
  it('매 국면 시작 시 묻는다. 영주가 없으면 묻지 않는다', () => {
    const r = run(
      { a: fighter('fc_a', SV.artoria, 'player', { fatePoints: 0 }), b: fighter('fc_c', SV.cu, 'ai'), terrain: 'open' },
      [3, 2, 3, 2, 3, 2],
      [50, 0, 50, 0, 50, 0],
    );
    expect(r.prompts.filter((p) => p.kind === 'phase_command').map((p) => (p as { phase_index: number }).phase_index)).toEqual([1, 2, 3]);
    const none = run(
      { a: fighter('fc_a', SV.artoria, 'player', { fatePoints: 0, seals: 0 }), b: fighter('fc_c', SV.cu, 'ai'), terrain: 'open' },
      [3, 2, 3, 2, 3, 2],
      [50, 0, 50, 0, 50, 0],
    );
    expect(none.prompts).toHaveLength(0);
  });
  it('영주 버프는 없다: 국면 지시는 보구 개방과 영주 보구 즉시 발동뿐 (D-142)', () => {
    const r = run(
      { a: fighter('fc_a', SV.artoria, 'player', { fatePoints: 0, mana: 0 }), b: fighter('fc_c', SV.cu, 'ai'), terrain: 'open' },
      [3, 2, 3, 2, 3, 2],
      [50, 0, 50, 0, 50, 0],
    );
    const cmds = r.prompts.filter((p) => p.kind === 'phase_command');
    expect(cmds.length).toBeGreaterThan(0);
    for (const p of cmds) expect(p.kind === 'phase_command' && p.options).toEqual(['seal_np']);
    for (const e of r.log.ofType('phase_rolled')) for (const roll of e.data.rolls) expect(roll.parts).not.toHaveProperty('seal');
  });
  it('보구 즉시 발동: 마력 0이어도 일방 보구, 마력 소모 없음 (D-076)', () => {
    const r = run(
      { a: fighter('fc_a', SV.artoria, 'player', { fatePoints: 0, mana: 0 }), b: fighter('fc_c', SV.cu, 'ai'), terrain: 'open' },
      [2, 5, 3, 2, 3, 2], // 보구 8 + 2 = 10 vs 내구 5 + 5 = 10 → 동점
      [50, 0, 50, 0], // 국면 1은 추첨 없음
      sealPolicy('seal_np'),
    );
    expect(r.log.ofType('np_opened')[0]!.data).toMatchObject({ seal: true, mana_before: 0, mana_after: 0 });
    expect(r.log.ofType('phase_started')[0]!.data).toMatchObject({ phase_id: 'ph_np_attack', attacker: 'fc_a' });
  });
});

describe('고정 보정 (dice.md §3.3)', () => {
  it('호감도·정보·진지 보정이 판정에 더해지고 내역이 남는다', () => {
    const r = run(
      { a: fighter('fc_a', SV.artoria, 'ai', { intelLevel: 2, bonus: { affinity: 1, camp: 2 } }), b: fighter('fc_c', SV.cu, 'ai'), terrain: 'open' },
      [2, 8, 2, 8, 2, 8], // 선제: 6 + 2 + 5 = 13 vs 7 + 8 = 15 → 쿠 훌린 승
      [50, 0, 50, 0, NO, 50, 0], // 국면 2 뒤 알트리아는 위험에서 버틴다
    );
    expect(r.log.ofType('phase_rolled')[0]!.data.rolls[0]).toMatchObject({ total: 13, parts: { affinity: 1, intel: 2, camp: 2 } });
  });
  it('기습한 쪽은 국면 1에만 보정 +2 (D-109)', () => {
    const r = run(
      { a: fighter('fc_a', SV.artoria, 'ai'), b: fighter('fc_c', SV.cu, 'ai'), terrain: 'open', ambusher: 'a' },
      [3, 4, 3, 2, 3, 2],
      [50, 50, 0, 50, 0],
    );
    expect(r.totals[0]).toEqual([11, 11]);
    expect(r.log.ofType('phase_rolled')[1]!.data.rolls[0]!.parts).toEqual({});
  });
});

describe('운명점은 실패했을 때만 묻는다 (D-119)', () => {
  it('이기고 있으면 묻지 않는다', () => {
    const r = run(
      { a: fighter('fc_h', SV.heracles, 'ai'), b: fighter('fc_k', SV.kojiro, 'player', { fatePoints: 3, seals: 0 }), terrain: 'urban' },
      [2, 11, 2, 11], // 선제: 헤라클레스 7 + 2 = 9 / 코지로 7.5 + 11 + 3 = 21.5 → 2단계로 위험, 버티다가 국면 2에서 쓰러짐
      [30, 0, NO, 30, 0],
    );
    expect(r.prompts.filter((p) => p.kind === 'reroll')).toHaveLength(0);
  });
  it('지고 있으면 묻고, 보정 내역을 같이 준다', () => {
    const r = run(
      { a: fighter('fc_h', SV.heracles, 'ai'), b: fighter('fc_k', SV.kojiro, 'player', { fatePoints: 1, seals: 0 }), terrain: 'urban' },
      [11, 2, 2, 11, 2, 11], // 국면 2에서 헤라클레스가 2단계로 위험, 버티다가 국면 3에서 쓰러짐
      [30, 0, 30, 0, NO, 30, 0],
    );
    const p = r.prompts.find((x) => x.kind === 'reroll');
    expect(p).toMatchObject({ own: { stats: ['agi'], total: 9.5 }, opponent_roll: { stats: ['agi'] } });
  });
});

describe('일방 보구를 막아 냄 (D-120)', () => {
  it('보구를 연 쪽이 판정에서 져도 피해를 입지 않는다', () => {
    const r = run(
      { a: fighter('fc_c', SV.cu, 'ai', { mana: 80 }), b: fighter('fc_h', SV.heracles, 'ai', { mana: 0 }), terrain: 'open' },
      [2, 10, 3, 3, 3, 3], // 쿠 훌린 보구 6 + 2 = 8 / 헤라클레스 내구 7 + 10 = 17. 국면 2·3은 동점
      [0, 50, 0, 50, 0],
    );
    const res = r.log.ofType('phase_resolved')[0]!.data;
    expect(res).toMatchObject({ phase_id: 'ph_np_attack', defended: true, skipped: true, loser: null, drop: 0 });
    expect(r.log.ofType('condition_changed')).toHaveLength(0);
  });
  it('보구를 연 쪽이 이기면 평소대로 피해', () => {
    const r = run(
      { a: fighter('fc_c', SV.cu, 'ai', { mana: 80 }), b: fighter('fc_h', SV.heracles, 'ai', { mana: 0 }), terrain: 'open' },
      [12, 2, 4, 4, 4, 4], // 6 + 12 + 3 = 21 ≥ 9 × 2 → 헤라클레스 위험, 버틴다. 국면 2·3 동점
      [0, NO, 50, 0, 50, 0],
    );
    expect(r.log.ofType('phase_resolved')[0]!.data).toMatchObject({ defended: false, loser: 'fc_h' });
  });
});

describe('보구 공개 즉시 정보 보정 (D-137)', () => {
  it.each(['a', 'b'] as const)('플레이어가 %s여도 공개한 국면부터 +3, 입력은 불변', (side) => {
    const player = fighter('fc_p', SV.artoria, 'player', { intelLevel: 1, mana: 0, seals: 0, fatePoints: 0 });
    const enemy = fighter('fc_e', SV.artoria, 'ai', { mana: 80 });
    const r = run(
      { a: side === 'a' ? player : enemy, b: side === 'b' ? player : enemy, terrain: 'open' },
      side === 'a' ? [7, 8, 5, 8, 5, 8] : [8, 7, 8, 5, 8, 5],
      [0, 55, 0, 55, 0],
    );
    const opened = r.log.ofType('np_opened')[0]!;
    const revealed = r.log.ofType('intel_gained');
    expect(revealed).toHaveLength(1);
    expect(revealed[0]!.seq).toBe(opened.seq + 1);
    expect(revealed[0]!.data).toMatchObject({ target: 'fc_e', level_from: 1, level_to: 3, cause: 'np' });
    for (const e of r.log.ofType('phase_rolled')) {
      expect(e.data.rolls.find((x) => x.faction === 'fc_p')!.parts.intel).toBe(3);
      expect(e.data.rolls.find((x) => x.faction === 'fc_e')!.parts.intel).toBeUndefined();
    }
    expect(r.out[side].intelLevel).toBe(3);
    expect(player.intelLevel).toBe(1);
    expect(player.bonus).toEqual({ affinity: 0, camp: 0 });
  });

  it('적끼리의 보구 개방은 플레이어에게 공개하지 않는다', () => {
    const r = run(
      { a: fighter('fc_a', SV.artoria, 'ai', { mana: 80 }), b: fighter('fc_c', SV.cu, 'ai'), terrain: 'forest' },
      [10, 10, 2, 3, 2, 3], [0, 0, 0, 0, 0],
    );
    expect(r.log.ofType('np_opened')).toHaveLength(1);
    expect(r.log.ofType('intel_gained')).toHaveLength(0);
  });
});
