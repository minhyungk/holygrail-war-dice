import { K } from '../data/constants';
import { type BattleInput, rngDice, runBattle } from './combat';
import { EventLog } from './events';
import { createRng } from './rng';

/** 승부가 난 경우만 센 승/패 비율 (합 1). 남은 국면에 승부가 날 수 없으면 null (D-140) */
export interface BattleForecast {
  win: number | null;
  loss: number | null;
  samples: number;
}

/** 실제 엔진을 현재 공개 시점부터 실행한다. RNG·입력·실제 이벤트 로그는 건드리지 않는다. */
export function forecastBattle(input: BattleInput, faction: string): BattleForecast {
  const samples = K['combat.forecast_samples'];
  let win = 0, loss = 0;
  const dice = rngDice(createRng(K['combat.forecast_seed']));
  const log = new EventLog();
  for (let i = 0; i < samples; i++) {
    log.events.length = 0;
    const outcome = runBattle({ ...input, captureForecast: false }, dice, log,
      (p) => p.kind === 'phase_command' ? 'none' : p.kind === 'danger_decision' ? 'fight' : false);
    // 무승부·퇴각은 세지 않는다
    if (outcome.winner === faction) win++;
    else if (outcome.winner) loss++;
  }
  const decided = win + loss;
  return decided ? { win: win / decided, loss: loss / decided, samples } : { win: null, loss: null, samples };
}
