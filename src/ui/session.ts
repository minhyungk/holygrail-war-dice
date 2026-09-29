// 화면과 엔진 사이. 판 준비(데이터 로딩)와 진행(제너레이터에 답 보내기), 이벤트 → 화면 항목 변환.
// 규칙 계산은 하지 않는다 (06-repo-structure.md §2).
import { TILES } from '../data/constants';
import { availableMasterIds, availableServantIds, loadClassDialogue, loadMasterProfiles, loadNarrationCommon, loadRunDialogue, loadServantProfiles, loadServantSkills } from '../data/load';
import type { ServantProfile } from '../data/schema';
import { type AnyEvent, EventLog } from '../engine/events';
import { planRun, playRun, type RunAnswer, type RunData, type RunPlan, type RunPrompt, type RunResult } from '../engine/run';
import type { RunView } from '../engine/view';
import { type Beat, Narrator } from '../narrative';
import { T } from './strings';

export interface Catalog {
  servants: ServantProfile[];
}

/** 메인·소환 화면용: 서번트 목록 (프로필만) */
export async function loadCatalog(): Promise<Catalog> {
  const servants = await loadServantProfiles(availableServantIds().sort());
  return { servants };
}

export function newSeed(): number {
  // 시드는 판정이 아니라 판 식별자다. 시각으로 만든다 (Math.random 금지, AGENTS.md 규칙 5)
  return (Date.now() ^ (performance.now() * 1000)) >>> 0;
}

export function makePlan(seed: number, summon: 'random' | 'catalyst', catalyst?: string): RunPlan {
  return planRun({ seed, summon, catalyst, servantIds: availableServantIds(), masterIds: availableMasterIds() });
}

export class Session {
  readonly log = new EventLog();
  private readonly gen: Generator<RunPrompt, RunResult, RunAnswer>;
  pending: RunPrompt | null = null;
  result: RunResult | null = null;
  private cursor = 0;

  constructor(
    readonly plan: RunPlan,
    readonly data: RunData,
    readonly narrator: Narrator,
    fatePoints: number,
    readonly labels: { unknown: string; cls: Record<string, string> },
  ) {
    this.gen = playRun(plan, data, { fatePoints }, this.log);
    this.advance(this.gen.next());
  }

  private advance(step: IteratorResult<RunPrompt, RunResult>) {
    if (step.done) {
      this.pending = null;
      this.result = step.value;
    } else this.pending = step.value;
  }

  answer(a: RunAnswer) {
    if (!this.pending) throw new Error('기다리는 선택이 없다');
    this.advance(this.gen.next(a));
  }

  tileName(id: string): string {
    return tileName(id);
  }

  /** 아직 화면에 넘기지 않은 이벤트 */
  takeEvents(): AnyEvent[] {
    const out = this.log.events.slice(this.cursor);
    this.cursor = this.log.events.length;
    return out;
  }
}

/** 판 하나에 필요한 데이터만 불러와 세션을 만든다 (D-065) */
export async function startSession(plan: RunPlan, fatePoints: number): Promise<Session> {
  const servantIds = [plan.player_servant_id, ...plan.enemies.map((e) => e.servant_id)];
  const masterIds = plan.enemies.map((e) => e.master_id);
  const [profiles, skills, masters, dialogue, common] = await Promise.all([
    loadServantProfiles(servantIds),
    loadServantSkills(servantIds),
    loadMasterProfiles(masterIds),
    loadRunDialogue(servantIds, masterIds),
    loadNarrationCommon(),
  ]);
  const classDialogue = await loadClassDialogue(profiles.map((p) => p.class));
  const data: RunData = {
    servants: Object.fromEntries(profiles.map((p) => [p.servant_id, p])),
    skills: Object.fromEntries(skills.map((s) => [s.servant_id, s])),
    masters: Object.fromEntries(masters.map((m) => [m.master_id, m])),
  };
  const narrator = new Narrator(
    {
      servantDialogue: dialogue.servants,
      masterDialogue: dialogue.masters,
      classDialogue,
      narrator: dialogue.narrator,
      servants: data.servants,
      masters: data.masters,
      tiles: TILES,
      labels: common.labels,
      beats: common.beats,
    },
    plan.seed,
  );
  return new Session(plan, data, narrator, fatePoints, { unknown: common.labels.unknown_servant, cls: common.labels.class_name });
}

// ── 이벤트 → 화면 항목 ──

export interface ShownLine {
  kind: 'line' | 'narration' | 'system';
  speaker: string | null;
  text: string;
  draft?: boolean;
  /** 서술 비트의 슬롯 (lead = 장면을 여는 나레이션). 판정 전에 먼저 보일 줄을 가르는 데 쓴다 */
  slot?: string;
  /** 누가 말하는가 (D-141): 내 서번트 / 상대 서번트 / 상대 마스터. 화면에서 색을 나눈다. 나레이션·시스템은 없음 */
  voice?: 'self' | 'enemy' | 'enemy_master';
  /** 출력 리듬 (D-133): chant = 보구 영창(느리게, 보구명은 빠르게), dramatic = 핵심 나레이션(조금 느리게) */
  pace?: 'chant' | 'dramatic';
}

/** 이벤트 하나를 재생한 결과: 보여줄 줄들 (없으면 바로 다음으로) */
export interface Played {
  event: AnyEvent;
  before: RunView;
  after: RunView;
  lines: ShownLine[];
  beat: Beat | null;
}

const tileName = (id: string) => TILES.find((t) => t.tile_id === id)?.name_ko ?? id;

/** 플레이어가 아는 범위의 이름 (정보 가림, narrative-engine.md §7.2) */
export function displayName(v: RunView, data: RunData, fc: string, labels: { unknown: string; cls: Record<string, string> }): string {
  const f = v.factions[fc];
  if (!f) return fc;
  const sv = data.servants[f.servant_id]!;
  const lv = fc === v.player ? 3 : (v.intel[fc] ?? 0);
  if (lv === 0) return labels.unknown;
  if (lv < 3) return labels.cls[sv.class] ?? sv.class;
  return sv.name_ko;
}

/**
 * 스킬 이름표 (D-142). 적 스킬은 진명(정보 3단계)을 알기 전엔 이름을 가린다: 스킬 이름이 정체를 드러내기 때문
 * 내 스킬이거나 진명을 알면 "카리스마 B", 아니면 null
 */
export function skillLabel(v: RunView, data: RunData, fc: string, skillId: string): string | null {
  const f = v.factions[fc];
  if (!f) return null;
  if (fc !== v.player && (v.intel[fc] ?? 0) < 3) return null;
  const sk = data.skills[f.servant_id]?.skills.find((x) => x.skill_id === skillId);
  if (!sk) return null;
  return sk.rank && sk.rank !== '-' ? `${sk.name_ko} ${sk.rank}` : sk.name_ko;
}

export function play(s: Session, e: AnyEvent, labels: { unknown: string; cls: Record<string, string> }): Played {
  const before = s.narrator.state;
  const beat = s.narrator.consume(e);
  const after = s.narrator.state;
  const P = after.player;
  const name = (fc: string) => displayName(after, s.data, fc, labels);
  const sys = (text: string): ShownLine => ({ kind: 'system', speaker: null, text });
  const lines: ShownLine[] = [];
  /** 서술 비트 앞에 나오는 요약 */
  const pre: ShownLine[] = [];
  const playerOut = !before.factions[P]?.alive && before.player !== '';
  const inMyBattle = (bid: string | null) => !!bid && !!before.battle?.sides.includes(P) && before.battle.id === bid;

  if (!playerOut) {
    switch (e.type) {
      case 'intel_gained':
        if (e.data.cause === 'np') lines.push(sys(T.sys.npReveal(name(e.data.target))));
        else if (e.data.result === 'success') lines.push(sys(`${T.sys.intelOk(name(e.data.target), T.intelLevel[e.data.level_to]!)} ${T.sys.check(e.data.roll!.total, e.data.dc)}`));
        else lines.push(sys(`${T.sys.intelFail} ${T.sys.check(e.data.roll!.total, e.data.dc)}`));
        break;
      case 'mana_supplied':
        lines.push(sys(`${T.sys.supply(T.sys.supplyResult[e.data.result]!, e.data.mana_before, e.data.mana_after)} ${T.sys.check(e.data.roll.total, null)}`));
        break;
      case 'bond':
        lines.push(sys(`${T.sys.bond(e.data.result === 'success')} ${T.sys.check(e.data.roll.total, e.data.dc)}`));
        break;
      case 'crafted':
        lines.push(sys(`${T.sys.craft(e.data.result === 'success', tileName(e.data.tile))} ${T.sys.check(e.data.roll.total, e.data.dc)}`));
        break;
      case 'affinity_changed':
        lines.push(sys(T.sys.affinity(e.data.from, e.data.to, T.affinityTier[e.data.tier_to]!)));
        break;
      case 'refused':
        if (e.data.faction === P) lines.push(sys(T.sys.refused));
        break;
      case 'escape_attempted':
        if (e.data.faction === P) lines.push(sys(e.data.success ? T.sys.escapeOk : T.sys.escapeFail));
        else if (e.data.rolls.some((r) => r.faction === P))
          lines.push(sys(e.data.success ? T.sys.enemyEscaped : T.sys.enemyEscapeFail));
        break;
      case 'encounter_decided': {
        const c = Object.entries(e.data.choices);
        if (!c.some(([fc]) => fc === P)) break;
        const enemy = c.find(([fc]) => fc !== P);
        if (enemy) lines.push(sys(enemy[1] === 'fight' ? T.sys.enemyWantsFight : T.sys.enemyWantsFlee));
        if (c.every(([, v]) => v === 'flee')) lines.push(sys(T.sys.parted));
        break;
      }
      case 'seal_used':
        if (e.data.faction === P) lines.push(sys(T.sys.seal(T.sys.sealPurpose[e.data.purpose]!, e.data.seals_left)));
        else if (inMyBattle(e.data.battle_id)) lines.push(sys(e.data.purpose === 'escape' ? T.sys.enemySealEscape : T.sys.enemySeal(T.sys.sealPurpose[e.data.purpose]!)));
        break;
      case 'battle_ended':
        if (inMyBattle(e.data.battle_id)) {
          const r = e.data.result === 'draw' ? 'draw' : e.data.escaped ? 'escape' : e.data.winner === P ? 'win' : 'loss';
          lines.push(sys(`${T.sys.battleEndLabel} — ${T.sys.battleEnd[r]!}${r === 'draw' ? ` (${T.sys.drawReason(e.data.phases)})` : ''}`));
        }
        break;
      case 'condition_recovered':
        if (e.data.faction === P) lines.push(sys(T.sys.recovered(T.condition[e.data.from]!, T.condition[e.data.to]!)));
        break;
      case 'betrayal_attempted':
        lines.push(sys(T.sys.betrayal));
        break;
      case 'betrayal_blocked':
        lines.push(sys(T.sys.betrayalBlocked));
        break;
      case 'final_started':
        lines.push(sys(T.sys.finalStart(e.data.factions.length)));
        break;
      case 'final_battle_bracket':
        lines.push(sys(T.sys.bracket(e.data.round, e.data.pairs.map(([a, b]) => `${name(a)} vs ${name(b)}`).join(', '), e.data.bye ? name(e.data.bye) : null)));
        break;
      case 'battle_started':
        if (e.data.sides.includes(P)) pre.push(sys(T.sys.battleStart(e.data.tile ? tileName(e.data.tile) : '')));
        break;
      case 'np_opened':
        if (!inMyBattle(e.data.battle_id)) break;
        if (e.data.faction !== P) pre.push(sys(T.sys.enemyNp(name(e.data.faction))));
        else if (e.data.seal) pre.push(sys(T.sys.sealNp));
        else pre.push(sys(T.sys.myNp(e.data.mana_before, e.data.mana_after)));
        break;
      case 'phase_resolved': {
        // 판정값 해설은 전투 묘사(서술)와 판정 카드가 맡는다. 여기서는 피해만 알린다
        if (!inMyBattle(e.data.battle_id)) break;
        if (e.data.loser && e.data.condition_from) {
          const to = e.data.condition_to === 'below' || !e.data.condition_to ? null : T.condition[e.data.condition_to]!;
          lines.push(sys(T.sys.damage(name(e.data.loser), e.data.drop, T.condition[e.data.condition_from]!, to)));
        }
        break;
      }
      case 'skill_triggered': {
        // 판정 보정·무효는 카드와 연출이 보인다. 버팀·마력 변화만 글로 알린다
        if (!inMyBattle(e.data.battle_id)) break;
        const label = skillLabel(after, s.data, e.data.faction, e.data.skill_id) ?? T.part.foeSkill!;
        if (e.data.effect === 'condition_guard') lines.push(sys(T.sys.skillGuard(label)));
        else if (e.data.effect === 'resource_change' && e.data.mana_after !== null) lines.push(sys(T.sys.skillMana(label, name(e.data.target), e.data.mana_after - e.data.amount, e.data.mana_after)));
        break;
      }
      case 'danger_decided':
        if (inMyBattle(e.data.battle_id) && e.data.faction !== P && e.data.choice === 'fight') lines.push(sys(T.sys.enemyHoldsOn(name(e.data.faction))));
        break;
      case 'condition_changed':
        if (inMyBattle(e.data.battle_id) && e.data.to === 'dead') lines.push(sys(T.sys.fell(name(e.data.faction))));
        break;
      case 'eliminated':
        if (e.data.faction === P) lines.push(sys(T.sys.playerOut));
        else if (e.data.by === P) lines.push(sys(T.sys.eliminatedEnemy(name(e.data.faction))));
        break;
    }
    // 서술 비트: 기본 시스템 요약 뒤가 아니라 앞에 둔다 (결과 문구가 비트를 닫는다)
    if (beat) {
      const mine = after.factions[P];
      const voiceOf = (speaker: string): ShownLine['voice'] =>
        speaker === 'narrator' ? undefined : speaker === mine?.servant_id || speaker === mine?.master_id ? 'self' : s.data.masters[speaker] ? 'enemy_master' : 'enemy';
      const narr: ShownLine[] = beat.lines.map((l) => ({
        kind: beat.style === 'system' ? 'system' : l.speaker === 'narrator' ? 'narration' : 'line',
        speaker: l.speakerName,
        text: l.text,
        draft: l.status === 'draft',
        slot: l.slot,
        voice: beat.style === 'system' ? undefined : voiceOf(l.speaker),
        pace:
          beat.type === 'np_opened' && l.speaker !== 'narrator'
            ? ('chant' as const)
            : beat.size === 'big' && l.speaker === 'narrator' && (l.slot === 'react' || beat.type === 'np_opened')
              ? ('dramatic' as const)
              : undefined,
      }));
      lines.unshift(...narr);
    }
    lines.unshift(...pre);
  }
  return { event: e, before, after, lines, beat };
}
