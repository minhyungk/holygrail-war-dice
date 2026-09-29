import { describe, expect, it } from 'vitest';
import { K } from '../data/constants';
import { scriptedDice, servant, SV } from '../testkit';
import { battle, type BattleInput, createFighter, type Policy, rngDice, runBattle } from './combat';
import { contest } from './dice';
import { EventLog } from './events';
import { forecastBattle } from './forecast';
import { createRng } from './rng';
import { miracleNaturals } from './stats';

const policy: Policy = (p) => p.kind === 'phase_command' ? 'none' : p.kind === 'danger_decision' ? 'fight' : false;
const input = (): BattleInput => ({
  battleId: 'bt_forecast', terrain: 'urban',
  a: createFighter('fc_a', servant(SV.artoria), 'player', { mana: 0, seals: 0, fatePoints: 0 }),
  b: createFighter('fc_b', servant(SV.artoria), 'ai', { mana: 0, seals: 0 }),
});
const lastPhase = (): BattleInput => ({
  ...input(), checkpoint: { completed: K['combat.phase_count'] - 1, npUsed: { a: 0, b: 0 }, skillUses: { a: {}, b: {} },
    current: { opened: { a: false, b: false }, aiDecided: true, phase: { id: 'ph_initiative', attacker: 'a' } } },
});

describe('전투 예상 승률 (D-139)', () => {
  it('예측 실행의 가상 선택은 실제 선택 알림(호감도 반응)을 부르지 않는다', () => {
    const calls: string[] = [];
    const state = { ...input(), onChoice: (_f: string, r: string) => calls.push(r) };
    forecastBattle(state, 'fc_a');
    expect(calls).toEqual([]);
    // 실제 전투에서 저장한 예측 입력에도 들어 있지 않다
    const log = new EventLog();
    runBattle({ ...state, captureForecast: true }, rngDice(createRng(3)), log, policy);
    for (const e of log.events) {
      const f = (e.data as { forecast?: BattleInput }).forecast;
      if (f) expect(f.onChoice).toBeUndefined();
    }
  });

  it('한 국면 남은 만전끼리는 승부가 날 수 없다: 승/패 없음 (전투를 새로 시작하지 않는다)', () => {
    const state = lastPhase();
    state.checkpoint!.current!.phase!.id = 'ph_clash';
    expect(forecastBattle(state, 'fc_a')).toMatchObject({ win: null, loss: null });
  });

  it('위험끼리의 마지막 국면은 36×36 전수 계산에서 동점(무승부)을 뺀 승/패 비율과 일치한다 (D-140)', () => {
    const state = lastPhase();
    state.a.condition = state.b.condition = 'danger';
    let wins = 0, losses = 0;
    const miracle = miracleNaturals(state.a.servant);
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
      for (let c = 1; c <= 6; c++) for (let d = 1; d <= 6; d++) {
        const result = contest({ roll: { dice: [a, b], natural: a + b }, modifier: 6, miracle },
          { roll: { dice: [c, d], natural: c + d }, modifier: 6, miracle });
        if (result.winner === 'a') wins++;
        if (result.winner === 'b') losses++;
      }
    }
    const result = forecastBattle(state, 'fc_a');
    expect(Math.abs(result.win! - wins / (wins + losses))).toBeLessThan(0.03);
    expect(result.win! + result.loss!).toBeCloseTo(1);
  });

  it('승/패 두 값만 있고 합이 1이다: 무승부·퇴각은 세지 않는다 (D-140)', () => {
    const result = forecastBattle(input(), 'fc_a');
    expect(Object.keys(result).sort()).toEqual(['loss', 'samples', 'win']);
    expect(result.win! + result.loss!).toBeCloseTo(1);
    expect(result.win).toBeGreaterThan(0);
    expect(result.loss).toBeGreaterThan(0);
  });

  it('확정된 일방 보구에서 방어 성공은 공격자에게 피해를 주지 않는다', () => {
    const state = lastPhase();
    state.a.condition = state.b.condition = 'danger';
    state.checkpoint!.current!.phase = { id: 'ph_np_attack', attacker: 'b' };
    expect(forecastBattle(state, 'fc_a').win).toBe(0);
  });

  it('강제 전투는 3국면 이후에도 이어진다', () => {
    const state = { ...lastPhase(), isFinal: true };
    const result = forecastBattle(state, 'fc_a');
    expect(result.win! + result.loss!).toBeCloseTo(1);
    expect(result.win).toBeGreaterThan(0);
    expect(result.loss).toBeGreaterThan(0);
  });

  it('예측을 반복해도 입력·실제 RNG·이벤트 결과가 변하지 않는다', () => {
    const original = { ...input(), captureForecast: true };
    original.a.seals = 1;
    const before = structuredClone(original);
    const rng = createRng(321), controlRng = createRng(321);
    const log = new EventLog(), controlLog = new EventLog();
    const gen = battle(original, rngDice(rng), log);
    let step = gen.next();
    let checked = false;
    while (!step.done) {
      if (!checked && step.value.forecast) {
        const snapshot = step.value.forecast;
        expect(forecastBattle(snapshot, 'fc_a')).toEqual(forecastBattle(snapshot, 'fc_a'));
        checked = true;
      }
      step = gen.next(policy(step.value));
    }
    const control = runBattle({ ...original, captureForecast: false }, rngDice(controlRng), controlLog, policy);
    expect(checked).toBe(true);
    expect(step.value).toEqual(control);
    expect(original).toEqual(before);
    expect(rng.next()).toBe(controlRng.next());
    const withoutForecast = log.events.map((e) => {
      const { forecast: _, ...data } = e.data as typeof e.data & { forecast?: BattleInput };
      return { ...e, data };
    });
    expect(withoutForecast).toEqual(controlLog.events);
  });

  it('영주 보구 사용 후 스냅샷은 비용과 횟수를 다시 적용하지 않는다', () => {
    const state = { ...input(), captureForecast: true };
    state.a.seals = 2;
    const log = new EventLog();
    const sealNp: Policy = (p) => p.kind === 'phase_command' ? (p.options.includes('seal_np') ? 'seal_np' : 'none') : p.kind === 'danger_decision' ? 'fight' : false;
    runBattle(state, scriptedDice([7, 7, 7, 7, 7, 7], [0, 0, 0, 0]), log, sealNp);
    const snapshot = log.ofType('phase_started')[0]!.data.forecast!;
    expect(snapshot.a.seals).toBe(1);
    expect(snapshot.checkpoint).toMatchObject({ npUsed: { a: 1, b: 0 },
      current: { opened: { a: true, b: false }, aiDecided: true, phase: { id: 'ph_np_attack', attacker: 'a' } } });
    const resumedLog = new EventLog();
    runBattle(snapshot, rngDice(createRng(44)), resumedLog, sealNp);
    expect(resumedLog.ofType('np_opened')).toHaveLength(0);
    expect(resumedLog.ofType('seal_used').filter((e) => e.data.faction === 'fc_a')).toHaveLength(0);
    expect(resumedLog.ofType('phase_started')[0]!.data.phase_id).toBe('ph_np_attack');
  });

  it('공개된 국면부터 이어 실행하면 국면을 다시 뽑지 않고 같은 결과가 난다', () => {
    const state = { ...input(), captureForecast: true };
    const log = new EventLog();
    const result = runBattle(state, scriptedDice([4, 4, 8, 4, 4, 4], [55, 0, 55, 0, 55, 0]), log, policy);
    const snapshot = log.ofType('phase_started')[1]!.data.forecast!;
    expect(snapshot.checkpoint!.completed).toBe(1);
    expect(snapshot.b.condition).toBe('full'); // 이후 피해가 과거 스냅샷에 섞이지 않는다
    const dice = scriptedDice([8, 4, 4, 4], [55, 0]);
    expect(runBattle(snapshot, dice, new EventLog(), policy)).toEqual(result);
    expect(dice.remaining()).toEqual({ rolls: 0, draws: 0 });
  });
});
