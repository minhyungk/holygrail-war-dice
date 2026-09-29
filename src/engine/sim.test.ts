// 헤드리스 시뮬 검증 (roadmap P1 완료 기준, dice.md §4).
// SIM_REPORT=1 이면 7기 상성표를 출력한다: npm run sim:battle
import { describe, expect, it } from 'vitest';
import { masterIds, runData, servant, servantIds, SV } from '../testkit';
import { matchup, simulateBattle, simulateRun } from './sim';

describe('헤드리스 시뮬', () => {
  it('같은 시드 = 같은 이벤트 로그 (dice.md §3.7)', () => {
    const s = { seed: 42, a: servant(SV.medea), b: servant(SV.heracles), terrain: 'open' as const, aController: 'player' as const };
    expect(JSON.stringify(simulateBattle(s).log.events)).toBe(JSON.stringify(simulateBattle(s).log.events));
    expect(JSON.stringify(simulateBattle(s).log.events)).not.toBe(JSON.stringify(simulateBattle({ ...s, seed: 43 }).log.events));
  });

  it('격차 최대(메데이아 vs 헤라클레스)에서도 약자 승률 > 0', () => {
    const st = matchup(servant(SV.medea), servant(SV.heracles), 4000, { isFinal: true });
    expect(st.aWin).toBeGreaterThan(0);
    expect(st.aWin + st.bWin).toBe(st.n); // 강제 전투는 무승부·도주 없음
  });

  it('2d6에서도 단일·2단계 피해가 모두 발생한다 (D-138)', () => {
    const st = matchup(servant(SV.artoria), servant(SV.cu), 4000);
    expect(st.twoStepRate).toBeGreaterThan(0);
    expect(st.twoStepRate).toBeLessThan(1);
  });

  it.runIf(process.env.SIM_REPORT)('상성표 출력', () => {
    const ids = servantIds();
    const n = Number(process.env.SIM_N ?? 2000);
    const pct = (x: number) => `${((x / n) * 100).toFixed(1)}%`;
    const rows: Record<string, Record<string, string>> = {};
    for (const a of ids) {
      rows[servant(a).name_ko] = {};
      for (const b of ids) {
        if (a === b) continue;
        const st = matchup(servant(a), servant(b), n, { isFinal: true });
        rows[servant(a).name_ko]![servant(b).name_ko] = pct(st.aWin);
      }
    }
    console.log(`\n강제 전투(결판까지) 행 서번트의 승률, 지형 4종 균등, 대전당 ${n}회`);
    console.table(rows);
    const normal: Record<string, Record<string, string>> = {};
    for (const a of ids) {
      normal[servant(a).name_ko] = {};
      for (const b of ids) {
        if (a === b) continue;
        const st = matchup(servant(a), servant(b), n);
        normal[servant(a).name_ko]![servant(b).name_ko] = `${pct(st.aWin)} / ${pct(st.draw)} / ${pct(st.aEscaped + st.bEscaped)}`;
      }
    }
    console.log(`\n일반 전투(3국면, 양측 적 AI) 행 서번트 승 / 무승부 / 도주`);
    console.table(normal);
  });

  it.runIf(process.env.SIM_REPORT)('한 판 통계 출력', () => {
    const data = runData();
    const n = Number(process.env.SIM_RUNS ?? 300);
    const stat = { victory: 0, finalReached: 0, battles: 0, playerBattles: 0, npcBattles: 0, encounters: 0, prompts: 0, events: 0 };
    const causes: Record<string, number> = {};
    const playerOut: Record<string, number> = {};
    const bySv: Record<string, { n: number; win: number }> = {};
    for (let seed = 1; seed <= n; seed++) {
      const r = simulateRun({ seed, data, servantIds: servantIds(), masterIds: masterIds() });
      const end = r.log.ofType('run_ended')[0]!;
      const sv = r.result.state.factions.fc_player!.servant.name_ko;
      bySv[sv] ??= { n: 0, win: 0 };
      bySv[sv].n++;
      if (end.data.result === 'victory') (stat.victory++, bySv[sv].win++);
      if (r.log.ofType('final_started').length) stat.finalReached++;
      const bs = r.log.ofType('battle_started');
      stat.battles += bs.length;
      stat.playerBattles += bs.filter((b) => b.data.sides.includes('fc_player')).length;
      stat.npcBattles += r.log.ofType('npc_battle_resolved').filter((e) => e.data.result !== 'none').length;
      stat.encounters += r.log.ofType('encounter').length;
      stat.prompts += r.prompts;
      stat.events += r.log.events.length;
      for (const e of r.log.ofType('eliminated')) {
        causes[e.data.cause] = (causes[e.data.cause] ?? 0) + 1;
        if (e.data.faction === 'fc_player') playerOut[`${e.time} ${e.data.cause}`] = (playerOut[`${e.time} ${e.data.cause}`] ?? 0) + 1;
      }
    }
    const avg = (x: number) => (x / n).toFixed(2);
    console.log(`\n한 판 ${n}회 (플레이어 자리는 자동 정책)`);
    console.table({ 우승률: `${((stat.victory / n) * 100).toFixed(1)}%`, 강제전투_도달: `${((stat.finalReached / n) * 100).toFixed(1)}%`, 판당_조우: avg(stat.encounters), 판당_전투: avg(stat.battles), 판당_플레이어전투: avg(stat.playerBattles), 판당_적끼리전투: avg(stat.npcBattles), 판당_선택: avg(stat.prompts), 판당_이벤트: avg(stat.events) });
    console.log('탈락 원인 (전체)'); console.table(causes);
    console.log('플레이어 탈락 시점·원인'); console.table(playerOut);
    console.log('서번트별 우승률'); console.table(Object.fromEntries(Object.entries(bySv).map(([k, v]) => [k, `${v.win}/${v.n} (${((v.win / v.n) * 100).toFixed(0)}%)`])));
  });
});
