// 헤드리스 시뮬 (roadmap P1). 화면 없이 전투를 대량으로 돌려 분포를 본다.
// autoPolicy는 시뮬레이션용 선택 규칙이며 게임 규칙이 아니다 (적 AI 규칙은 combat.ts 안에 있다).
import { TERRAINS, type ServantProfile, type Terrain } from '../data/schema';
import { type BattleOutcome, createFighter, type Fighter, type Policy, rngDice, runBattle } from './combat';
import { EventLog } from './events';
import { createRng, deriveSeed } from './rng';
import { planRun, playRun, type RunAnswer, type RunData, type RunPrompt, type RunResult } from './run';

/** 플레이어 자리를 대신 두는 정책: 보구는 열 수 있으면 열고(아니면 약점 공략), 지고 있으면 재굴림, 도주는 영주 우선 */
export const autoPolicy: Policy = (p) => {
  switch (p.kind) {
    case 'phase_command':
      return p.options.includes('np') ? 'np' : p.options.includes('weakness') ? 'weakness' : 'none';
    case 'reroll':
      if (p.dc !== null) return p.own.total < p.dc;
      return p.opponent_total !== null && p.own.total <= p.opponent_total;
    case 'danger_decision':
      // 시뮬레이션용: 영주가 있으면 퇴각, 없으면 버틴다
      return p.options.includes('seal') ? 'seal' : 'fight';
  }
};

export interface SimBattle {
  seed: number;
  a: ServantProfile;
  b: ServantProfile;
  terrain: Terrain;
  aController?: Fighter['controller'];
  isFinal?: boolean;
}

export function simulateBattle(s: SimBattle): { outcome: BattleOutcome; log: EventLog } {
  const log = new EventLog();
  const rng = createRng(deriveSeed(s.seed, 'judge'));
  const outcome = runBattle(
    {
      battleId: `bt_sim_${s.seed}`,
      a: createFighter('fc_a', s.a, s.aController ?? 'ai'),
      b: createFighter('fc_b', s.b, 'ai'),
      terrain: s.terrain,
      isFinal: s.isFinal ?? false,
    },
    rngDice(rng),
    log,
    autoPolicy,
  );
  return { outcome, log };
}

export interface MatchupStats {
  n: number;
  aWin: number;
  bWin: number;
  draw: number;
  aEscaped: number;
  bEscaped: number;
  aEscapeFailed: number;
  /** 결판난 국면 중 2단계 하락 비율 */
  twoStepRate: number;
}

/** a vs b를 n번. 지형은 4종을 번갈아 쓴다 */
export function matchup(a: ServantProfile, b: ServantProfile, n: number, opts: { seed?: number; aController?: Fighter['controller']; isFinal?: boolean } = {}): MatchupStats {
  const st: MatchupStats = { n, aWin: 0, bWin: 0, draw: 0, aEscaped: 0, bEscaped: 0, aEscapeFailed: 0, twoStepRate: 0 };
  let decided = 0;
  let twoStep = 0;
  for (let i = 0; i < n; i++) {
    const { outcome: o, log } = simulateBattle({ seed: (opts.seed ?? 0) + i, a, b, terrain: TERRAINS[i % TERRAINS.length]!, aController: opts.aController, isFinal: opts.isFinal });
    if (o.result === 'win') o.winner === 'fc_a' ? st.aWin++ : st.bWin++;
    else if (o.result === 'draw') st.draw++;
    else if (o.result === 'escape') o.escaped === 'fc_a' ? st.aEscaped++ : st.bEscaped++;
    else st.aEscapeFailed++;
    for (const e of log.ofType('phase_resolved')) {
      if (e.data.skipped) continue;
      decided++;
      if (e.data.drop === 2) twoStep++;
    }
  }
  st.twoStepRate = decided ? twoStep / decided : 0;
  return st;
}

/**
 * 판 전체 자동 진행용 정책 (시뮬레이션용, 게임 규칙 아님). 같은 시드면 같은 선택을 한다.
 * 낮·밤 무작위 이동(머무르기 포함). 진지 작성·마력 공급 요청은 받아들인다.
 */
export function autoRunPolicy(seed: number): (p: RunPrompt) => RunAnswer {
  const rng = createRng(deriveSeed(seed, 'policy'));
  return (p) => {
    switch (p.kind) {
      case 'action':
        // 밤: 무작위 이동 또는 머무르기
        return { action: 'move', to: p.reachable[rng.int(0, p.reachable.length - 1)]! };
      case 'day_action':
        // 낮 메뉴: 진명을 모르는 적이 남았으면 반반, 아니면 교류
        return { action: p.intel_open && rng.int(0, 1) === 0 ? 'intel' : 'bond' };
      case 'supply_offer':
        return true;
      case 'encounter':
        return 'fight';
      case 'post_choice':
        return rng.int(0, 1) === 0 ? 'execute' : 'release';
      case 'betrayal_block':
        return true;
      default:
        return autoPolicy(p as Parameters<typeof autoPolicy>[0]);
    }
  };
}

/** 판 하나를 끝까지 자동으로 돌린다 */
export function simulateRun(opts: { seed: number; data: RunData; servantIds: string[]; masterIds: string[]; fatePoints?: number }): { result: RunResult; log: EventLog; prompts: number } {
  const plan = planRun({ seed: opts.seed, summon: 'random', servantIds: opts.servantIds, masterIds: opts.masterIds });
  const log = new EventLog();
  const gen = playRun(plan, opts.data, { fatePoints: opts.fatePoints ?? 3 }, log);
  const policy = autoRunPolicy(opts.seed);
  let prompts = 0;
  let step = gen.next();
  while (!step.done) {
    prompts++;
    step = gen.next(policy(step.value));
  }
  return { result: step.value, log, prompts };
}
