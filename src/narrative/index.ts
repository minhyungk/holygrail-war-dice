// 서술 엔진 (docs/systems/narrative-engine.md, D-058, D-104). 순수 TS: React/DOM을 import하지 않는다.
// 판정 엔진이 만든 이벤트를 순서대로 읽어 비트(대사·나레이션 묶음)를 만든다. 게임 결과에는 관여하지 않는다.
// 무작위는 판정과 분리된 서술 스트림을 쓴다 (§2).
import { K } from '../data/constants';
import type { BeatsFile, DialogueFile, LabelsFile, Line, MasterProfile, ServantProfile, SlotDef, Tile } from '../data/schema';
import type { AnyEvent, GameEvent } from '../engine/events';
import { createRng, deriveSeed, type Rng } from '../engine/rng';
import { distance } from '../engine/map';
import { applyEvent, emptyView, type RunView } from '../engine/view';
import { josa, JOSA_PAIRS, type JosaPair } from './josa';
import { type Candidate, type Facts, type Memory, pick, whenOk } from './select';

export interface NarratorData {
  servantDialogue: DialogueFile[];
  masterDialogue: DialogueFile[];
  classDialogue: DialogueFile[];
  narrator: DialogueFile;
  servants: Record<string, ServantProfile>;
  masters: Record<string, MasterProfile>;
  tiles: readonly Tile[];
  labels: LabelsFile;
  beats: BeatsFile;
}

export type Slot = SlotDef['slot'];
export interface BeatLine {
  slot: Slot;
  /** narrator, 서번트 ID, 마스터 ID */
  speaker: string;
  /** 화면에 보일 화자 이름. 나레이션은 null */
  speakerName: string | null;
  text: string;
  textId: string;
  status: Line['status'];
}
export interface Beat {
  seq: number;
  type: AnyEvent['type'];
  size: 'big' | 'normal' | 'small';
  /** system: 화면에서 시스템 문구 모양 (호감도 변화 등) */
  style?: 'system';
  lines: BeatLine[];
}

/** line_spoken (narrative-engine.md §3.2, §8.6) */
export interface LineSpoken {
  text_id: string;
  speaker: string;
  slot: Slot;
  cause_seq: number;
}

type Size = Beat['size'];
const CAP: Record<Size, () => number> = {
  big: () => K['text.lines_per_beat_big'],
  normal: () => K['text.lines_per_beat'],
  small: () => K['text.lines_per_beat_small'],
};

interface Picked {
  def: SlotDef;
  cand: Candidate;
  /** 화자 진영 (나레이션이면 null) */
  faction: string | null;
}

export class Narrator {
  private view: RunView = emptyView();
  private readonly rng: Rng;
  private readonly mem: Memory = { said: new Map(), beat: 0, lastInPool: new Map() };
  readonly spoken: LineSpoken[] = [];
  private readonly lines = new Map<string, Candidate[]>(); // `${owner}|${tag}` → 후보
  private readonly tileById: Map<string, Tile>;

  // 기억 (§4.3)
  private encounters = new Map<string, number>();
  private metBefore = false;
  private lastResult = new Map<string, 'win' | 'loss' | 'draw' | 'escape'>();
  private released = new Set<string>();
  private executedCount = 0;
  private nearDeath = 0;
  private rumors: GameEvent<'npc_battle_resolved'>[] = [];
  // 장면 (§8.4)
  private scene = { settingTold: false, beatIndex: 0, motif: null as string | null };
  private opponent: string | null = null;
  private playerBattle: string | null = null;
  private battleTile: string | null = null;
  private npPhase: string | null = null;
  private phaseAttacker: string | null = null;
  private phaseDefender: string | null = null;

  constructor(
    private readonly data: NarratorData,
    seed: number,
    private readonly playerMasterName: string = data.labels.player_master,
  ) {
    this.rng = createRng(deriveSeed(seed, 'narrative'));
    this.tileById = new Map(data.tiles.map((t) => [t.tile_id, t]));
    const index = (file: DialogueFile, owner: string, layer: number) => {
      for (const [tag, list] of Object.entries(file.tags))
        for (const raw of list) {
          const line = { ...file.defaults, ...raw } as Line;
          const narr = line.speaker === 'narrator';
          const key = `${narr ? `narrator@${owner}` : owner}|${tag}`;
          const arr = this.lines.get(key) ?? [];
          arr.push({ line, textId: `tx_${owner}_${tag}_${line.id}`, layer, speaker: narr ? 'narrator' : owner });
          this.lines.set(key, arr);
        }
    };
    for (const f of data.servantDialogue) index(f, f.speaker, 0);
    for (const f of data.masterDialogue) index(f, f.speaker, 0);
    for (const f of data.classDialogue) index(f, f.scope ?? f.speaker, 1);
    index(data.narrator, 'common', 2);
  }

  /** 현재 보기 (마지막으로 읽은 이벤트까지) */
  get state(): RunView {
    return this.view;
  }

  /** 소환 대사 (S1_SUMMON). 비트가 아니라 한 줄 */
  summonLine(servantId: string): BeatLine | null {
    const c = pick(this.candidates(servantId, 'summon', false), {}, this.mem, this.rng, `${servantId}|summon`);
    return c ? this.toLine('line', c, null, {}, new Set()) : null;
  }

  /** 이벤트를 순서대로 모두 넣는다. 비트가 없으면 null */
  consume(e: AnyEvent): Beat | null {
    const before = this.view;
    this.view = applyEvent(this.view, e);
    this.mem.beat += 1;
    const beat = this.compose(e, before);
    this.remember(e, before);
    return beat;
  }

  // ── 기억 갱신 ──
  private remember(e: AnyEvent, before: RunView) {
    const P = this.view.player;
    switch (e.type) {
      case 'encounter': {
        const enemy = e.data.factions.find((f) => f !== P);
        if (!enemy || !e.data.factions.includes(P)) break;
        this.opponent = enemy;
        break;
      }
      case 'battle_ended':
        if (this.playerBattle === e.data.battle_id && this.opponent) {
          const r = e.data.result === 'draw' ? 'draw' : e.data.result === 'escape' ? 'escape' : e.data.winner === P ? 'win' : 'loss';
          this.lastResult.set(this.opponent, r);
        }
        this.playerBattle = null;
        break;
      case 'post_choice':
        if (e.data.choice === 'release') this.released.add(e.data.target);
        else this.executedCount += 1;
        break;
      case 'condition_changed':
        if (e.data.faction === P && e.data.to === 'danger' && before.factions[P]?.condition !== 'danger') this.nearDeath += 1;
        break;
      case 'npc_battle_resolved':
        if (e.data.result === 'win') this.rumors.push(e);
        break;
      case 'day_started':
        this.rumors = [];
        break;
    }
  }

  // ── 비트 구성 (§8) ──
  private compose(e: AnyEvent, before: RunView): Beat | null {
    const P = this.view.player;
    let tpl = this.data.beats.beats[e.type];
    const ctx: Ctx = { event: {}, self: P, enemy: this.opponent, actor: null, names: {} };

    switch (e.type) {
      case 'day_started': {
        this.newScene();
        const rumor = this.rumors[0];
        if (rumor) {
          const loser = rumor.data.loser!;
          ctx.event = { rumor: true, rumor_known: (this.view.intel[loser] ?? 0) >= 1 };
          ctx.names.loser = loser;
        }
        break;
      }
      case 'night_started':
        this.newScene();
        break;
      case 'bond':
        this.newScene();
        ctx.event = { result: e.data.result };
        break;
      case 'mana_supplied':
        this.newScene();
        ctx.event = { result: e.data.result };
        break;
      case 'intel_gained':
        this.newScene();
        ctx.enemy = e.data.target;
        ctx.event = { result: e.data.result, intel_level: e.data.result === 'success' ? e.data.level_to : null, cause: e.data.cause };
        break;
      case 'encounter': {
        if (!e.data.factions.includes(P)) return null;
        this.newScene();
        const enemy = e.data.factions.find((f) => f !== P)!;
        ctx.enemy = enemy;
        this.metBefore = (this.encounters.get(enemy) ?? 0) > 0;
        this.encounters.set(enemy, (this.encounters.get(enemy) ?? 0) + 1);
        break;
      }
      case 'battle_started': {
        if (!e.data.sides.includes(P)) return null;
        this.playerBattle = e.data.battle_id;
        this.battleTile = e.data.tile;
        const enemy = e.data.sides.find((f) => f !== P)!;
        if (this.opponent !== enemy) {
          // 강제 전투는 조우 없이 시작한다
          this.metBefore = (this.encounters.get(enemy) ?? 0) > 0;
          this.encounters.set(enemy, (this.encounters.get(enemy) ?? 0) + 1);
          this.newScene();
        }
        this.opponent = enemy;
        ctx.enemy = enemy;
        break;
      }
      case 'phase_started':
        if (this.playerBattle !== e.data.battle_id) return null;
        this.phaseAttacker = e.data.attacker;
        this.phaseDefender = e.data.defender;
        ctx.event = { phase_id: e.data.phase_id };
        break;
      case 'affinity_changed': {
        // 호감도 변화 시스템 문구 (D-121): 방향 · 크기 · 단계 변화 · 원인
        if (e.data.faction !== P) return null;
        const delta = Math.abs(e.data.to - e.data.from);
        const [m1, m2] = K['text.affinity_magnitude'] as [number, number];
        ctx.event = {
          direction: e.data.to > e.data.from ? 'up' : 'down',
          delta,
          magnitude: delta < m1 ? 'small' : delta < m2 ? 'mid' : 'big',
          tier_changed: e.data.tier_from !== e.data.tier_to,
          tier_to: e.data.tier_to,
          cause: e.data.cause,
        };
        break;
      }
      case 'np_opened':
        if (this.playerBattle !== e.data.battle_id) return null;
        ctx.actor = e.data.faction;
        ctx.names.actor = e.data.faction;
        ctx.beat = { actor_side: e.data.faction === P ? 'self' : 'enemy' };
        // 같은 국면에 상대가 먼저 열었으면 맞선 개방 (D-113)
        ctx.event = { seal: e.data.seal, counter: this.npPhase === `${e.data.battle_id}/${e.data.phase_index}` };
        this.npPhase = `${e.data.battle_id}/${e.data.phase_index}`;
        break;
      case 'phase_resolved': {
        if (this.playerBattle !== e.data.battle_id) return null;
        const to = e.data.condition_to;
        ctx.event = {
          phase_id: e.data.phase_id,
          margin: e.data.margin,
          miracle: e.data.miracle,
          drop: e.data.drop,
          result: e.data.defended ? 'defended' : e.data.skipped ? 'skipped' : 'resolved',
          condition_to: to === 'below' ? null : to,
          self_lost: e.data.loser === P,
        };
        if (e.data.winner) ctx.names.winner = e.data.winner;
        if (e.data.loser) ctx.names.loser = e.data.loser;
        if (e.data.defended && this.phaseAttacker && this.phaseDefender) {
          // 일방 보구를 막아 냄 (D-120): 연 쪽이 actor, 버틴 쪽이 target
          ctx.names.actor = this.phaseAttacker;
          ctx.names.target = this.phaseDefender;
        }
        ctx.phaseWinner = e.data.winner;
        break;
      }
      case 'seal_used':
        if (e.data.battle_id && this.playerBattle !== e.data.battle_id) return null;
        if (e.data.faction !== P && e.data.faction !== this.opponent) return null;
        ctx.actor = e.data.faction;
        ctx.event = { purpose: e.data.purpose };
        ctx.beat = { actor_side: e.data.faction === P ? 'self' : 'enemy' };
        break;
      case 'battle_ended': {
        if (this.playerBattle !== e.data.battle_id) return null;
        const selfResult = e.data.result === 'draw' ? 'draw' : e.data.winner === P ? 'win' : e.data.loser === P ? 'loss' : null;
        const side = (fc: string | null) => (fc === null ? null : fc === P ? 'self' : 'enemy');
        ctx.event = { result: e.data.result, self_result: selfResult, dead_side: side(e.data.dead), escaped_side: side(e.data.escaped) };
        if (e.data.winner) ctx.names.winner = e.data.winner;
        if (e.data.loser) ctx.names.loser = e.data.loser;
        break;
      }
      case 'post_choice':
        ctx.enemy = e.data.target;
        ctx.event = { choice: e.data.choice };
        break;
      case 'npc_battle_resolved': {
        // 보지 못한 적끼리 전투의 간접 묘사 (D-130): 밤에, 플레이어가 살아 있을 때만
        const me = this.view.factions[P];
        if (e.data.result === 'none' || !me?.alive || e.data.factions.includes(P)) return null;
        this.newScene();
        ctx.event = { result: e.data.result, near: distance(me.tile, e.data.tile) <= 1 };
        break;
      }
      case 'final_started':
        this.newScene();
        break;
      default:
        return null;
    }
    if (!tpl) return null;
    void before;

    const size: Size = tpl.size === 'auto' ? this.phaseSize(ctx.event) : tpl.size;
    const picked = this.fill(tpl.slots, ctx);
    if (!picked.length) return null;
    const trimmed = this.trim(picked, size);
    const mentioned = new Set<string>();
    const lines = trimmed.map((p) => this.toLine(p.def.slot, p.cand, p.faction, this.namesFor(p, ctx), mentioned));
    for (const l of lines) this.spoken.push({ text_id: l.textId, speaker: l.speaker, slot: l.slot, cause_seq: e.seq });
    this.scene.beatIndex += 1;
    return { seq: e.seq, type: e.type, size, style: tpl.style, lines };
  }

  private newScene() {
    this.scene = { settingTold: false, beatIndex: 0, motif: null };
  }

  /** 국면 결과 비트 크기 (§8.5): 2단계 하락·기적·위험 진입 = 큰, 스킵·작은 차이 = 작은 */
  private phaseSize(ev: Facts): Size {
    if (ev.drop === 2 || ev.miracle === true || ev.condition_to === 'danger' || ev.condition_to === null) return ev.result === 'skipped' ? 'small' : 'big';
    if (ev.result === 'skipped' || (typeof ev.margin === 'number' && ev.margin <= K['text.small_margin'])) return 'small';
    return 'normal';
  }

  /** §8.3: 대사(line/answer)를 먼저 고르고, 나레이션은 고른 대사를 사실로 받아 따라간다 */
  private fill(slots: SlotDef[], ctx: Ctx): Picked[] {
    const chosen: (Picked | null)[] = slots.map(() => null);
    const order = slots.map((s, i) => ({ s, i }));
    const speakers = order.filter(({ s }) => s.from !== 'narrator');
    const narr = order.filter(({ s }) => s.from === 'narrator');
    for (const { s, i } of [...speakers, ...narr]) {
      const faction = this.factionOf(s.from, ctx);
      if (s.from !== 'narrator' && !faction) continue;
      // 나레이션의 beat.line.*는 바로 앞의 대사를 가리킨다 (Q-156 ①)
      let prev: Picked | null = null;
      for (let j = i - 1; j >= 0; j--) if (chosen[j] && chosen[j]!.def.from !== 'narrator') (prev = chosen[j]!, (j = -1));
      const firstLine = chosen.find((c) => c && c.def.slot === 'line') ?? null;
      const ref = s.slot === 'react' || s.slot === 'tail' ? (prev ?? firstLine) : firstLine;
      const facts = this.facts(s.from, faction, ctx, ref);
      if (s.if && !whenOk(s.if, facts)) continue;
      const tag = s.tag ?? (s.tag_by ? s.tag_by.map[String(facts[s.tag_by.fact])] : undefined);
      if (!tag) continue;
      const owner = s.from === 'narrator' ? null : this.ownerOf(s.from, faction!);
      let cands = s.from === 'narrator' ? this.narrationCandidates(tag, s.slot, ctx) : this.candidates(owner!, tag, false);
      if (s.when_has) cands = cands.filter((c) => c.line.when && s.when_has! in c.line.when);
      if (s.when_lacks) cands = cands.filter((c) => !c.line.when || !(s.when_lacks! in c.line.when));
      const c = pick(cands, facts, this.mem, this.rng, `${owner ?? 'narrator'}|${tag}|${s.slot}`);
      if (!c) continue;
      if (s.slot === 'lead' && c.line.when && 'world.terrain' in c.line.when) this.scene.settingTold = true;
      chosen[i] = { def: s, cand: c, faction };
    }
    return chosen.filter((c): c is Picked => c !== null);
  }

  /** 템포 (§8.5): 나레이션 연속 상한 → 줄 수 상한. line·answer·protected는 자르지 않는다 (Q-156 ②) */
  private trim(items: Picked[], size: Size): Picked[] {
    const out = [...items];
    const cuttable = (p: Picked) => p.def.from === 'narrator' && !p.def.protected;
    const spec = (p: Picked) => Object.keys(p.cand.line.when ?? {}).length;
    for (;;) {
      let run: number[] = [];
      let worst = -1;
      for (let i = 0; i < out.length; i++) {
        if (out[i]!.def.from !== 'narrator') {
          run = [];
          continue;
        }
        run.push(i);
        if (run.length > K['text.max_narration_run']) {
          const pool = run.filter((j) => cuttable(out[j]!));
          if (pool.length) worst = pool.reduce((a, b) => (spec(out[b]!) < spec(out[a]!) ? b : a));
          break;
        }
      }
      if (worst < 0) break;
      out.splice(worst, 1);
    }
    const cap = CAP[size]();
    while (out.length > cap) {
      let removed = false;
      for (const slot of ['tail', 'react', 'lead'] as const) {
        const idx = out.map((p, i) => (p.def.slot === slot && cuttable(p) ? i : -1)).filter((i) => i >= 0);
        if (idx.length) {
          out.splice(idx[idx.length - 1]!, 1);
          removed = true;
          break;
        }
      }
      if (!removed) break;
    }
    return out;
  }

  // ── 후보 ──
  private candidates(owner: string, tag: string, narration: boolean): Candidate[] {
    const out = [...(this.lines.get(`${narration ? `narrator@${owner}` : owner}|${tag}`) ?? [])];
    const sv = this.data.servants[owner];
    if (sv && !narration) out.push(...(this.lines.get(`class:${sv.class}|${tag}`) ?? []));
    return out;
  }
  /** 나레이션 후보: 관련 서번트 파일의 서술문(§5.2) + 공통 나레이션 */
  private narrationCandidates(tag: string, slot: Slot, ctx: Ctx): Candidate[] {
    const out: Candidate[] = [];
    for (const fc of [ctx.actor, ctx.enemy, ctx.self]) {
      const sv = fc ? this.view.factions[fc]?.servant_id : null;
      if (sv) out.push(...(this.lines.get(`narrator@${sv}|${tag}`) ?? []));
    }
    out.push(...(this.lines.get(`common|${tag}`) ?? []));
    return out.filter((c) => (c.line.slot ?? 'lead') === slot || (slot === 'lead' && !c.line.slot));
  }

  private factionOf(from: SlotDef['from'], ctx: Ctx): string | null {
    switch (from) {
      case 'narrator':
        return null;
      case 'self':
        return ctx.self;
      case 'enemy':
      case 'enemy_master':
        return ctx.enemy;
      case 'actor':
        return ctx.actor;
    }
  }
  private ownerOf(from: SlotDef['from'], faction: string): string {
    const f = this.view.factions[faction]!;
    return from === 'enemy_master' ? f.master_id! : f.servant_id;
  }

  // ── 사실 (§4) ──
  private facts(from: SlotDef['from'], speakerFaction: string | null, ctx: Ctx, ref: Picked | null): Facts {
    const P = this.view.player;
    const selfFc = speakerFaction ?? P;
    const enemyFc = selfFc === P ? ctx.enemy : P;
    const v = this.view;
    const s = v.factions[selfFc];
    const o = enemyFc ? v.factions[enemyFc] : undefined;
    const known = (fc: string | null | undefined) => (!fc ? null : fc === P ? 3 : (v.intel[fc] ?? 0));
    const tileId = v.battle?.tile ?? this.battleTile ?? v.factions[P]?.tile;
    const t = tileId ? this.tileById.get(tileId) : undefined;
    const f: Facts = {
      'world.day': v.day,
      'world.time': v.time,
      'world.terrain': t?.terrain,
      'world.tile': tileId,
      'world.factions_alive': Object.values(v.factions).filter((x) => x.alive).length,
      'battle.phase_index': v.battle?.phaseIndex,
      'battle.is_final': v.battle?.isFinal ?? v.time === 'final',
      'scene.setting_told': this.scene.settingTold,
      'scene.beat_index': this.scene.beatIndex,
      'scene.motif': this.scene.motif,
      'beat.has_line': !!ref,
      'beat.line.tone': ref?.cand.line.tone,
      'beat.line.speaker': ref?.cand.speaker,
      'beat.line.id': ref?.cand.line.id,
      'mem.met_before': this.metBefore,
      'mem.last_result': ctx.enemy ? this.lastResult.get(ctx.enemy) : undefined,
      'mem.released': ctx.enemy ? this.released.has(ctx.enemy) : false,
      'mem.executed_count': this.executedCount,
      'mem.near_death_count': Math.max(0, this.nearDeath - (ctx.event.self_lost && v.factions[P]?.condition === 'danger' ? 1 : 0)),
    };
    for (const [k, val] of Object.entries(ctx.event)) f[`event.${k}`] = val;
    for (const [k, val] of Object.entries(ctx.beat ?? {})) f[`beat.${k}`] = val;
    if (s) {
      const sv = this.data.servants[s.servant_id]!;
      Object.assign(f, {
        'self.servant': s.servant_id,
        'self.class': sv.class,
        'self.condition': s.condition,
        'self.mana': s.mana,
        'self.seals': s.seals,
        'self.alignment': sv.alignment ?? 'neutral',
        'self.intel_level': known(selfFc),
        'self.phase_won': ctx.phaseWinner === undefined || ctx.phaseWinner === null ? undefined : ctx.phaseWinner === selfFc,
      });
      if (s.affinity !== null) f['self.affinity_tier'] = tierName(s.affinity);
    }
    if (o) {
      Object.assign(f, {
        'enemy.servant': o.servant_id,
        'enemy.class': this.data.servants[o.servant_id]!.class,
        'enemy.condition': o.condition,
        'enemy.intel_level': known(enemyFc),
        'enemy.master': o.master_id,
      });
      if (s) f['pair.id'] = [s.servant_id, o.servant_id].sort().join('+');
    }
    void from;
    return f;
  }

  // ── 문장 조립 (§7) ──
  private namesFor(p: Picked, ctx: Ctx): Record<string, string | null> {
    const P = this.view.player;
    const selfFc = p.faction ?? P;
    const enemyFc = selfFc === P ? ctx.enemy : P;
    return {
      servant: selfFc,
      enemy: enemyFc,
      actor: ctx.names.actor ?? ctx.actor,
      target: ctx.names.target ?? null,
      winner: ctx.names.winner ?? null,
      loser: ctx.names.loser ?? null,
      enemy_master: enemyFc,
      servant_class: selfFc,
    };
  }

  /** 정보 가림 (§7.2): 플레이어 서번트는 항상 진명, 적은 정보 단계에 따라 */
  private display(fc: string | null, mentioned: Set<string>): string {
    if (!fc) return '';
    const v = this.view;
    const f = v.factions[fc];
    if (!f) return '';
    const sv = this.data.servants[f.servant_id]!;
    const level = fc === v.player ? 3 : (v.intel[fc] ?? 0);
    if (level === 0) return this.data.labels.unknown_servant;
    if (level < 3) return this.data.labels.class_name[sv.class] ?? sv.class;
    // 한 비트 안에서 두 번째부터 이름 축약 (Q-156 ③)
    const name = mentioned.has(fc) && sv.name_short_ko ? sv.name_short_ko : sv.name_ko;
    mentioned.add(fc);
    return name;
  }

  private toLine(slot: Slot, c: Candidate, faction: string | null, refs: Record<string, string | null>, mentioned: Set<string>): BeatLine {
    const v = this.view;
    const value = (key: string): string => {
      switch (key) {
        case 'master':
          return this.playerMasterName;
        case 'servant':
        case 'enemy':
        case 'actor':
        case 'target':
        case 'winner':
        case 'loser':
          return this.display(refs[key] ?? null, mentioned);
        case 'enemy_master': {
          const m = refs.enemy_master ? v.factions[refs.enemy_master]?.master_id : null;
          return m ? (this.data.masters[m]?.name_ko ?? '') : this.playerMasterName;
        }
        case 'servant_class': {
          const f = refs.servant_class ? v.factions[refs.servant_class] : null;
          const sv = f ? this.data.servants[f.servant_id] : null;
          return sv ? (this.data.labels.class_name[sv.class] ?? sv.class) : '';
        }
        case 'place': {
          const t = v.battle?.tile ?? v.factions[v.player]?.tile;
          return t ? (this.tileById.get(t)?.name_ko ?? '') : '';
        }
        case 'day':
          return String(v.day);
        case 'np': {
          const f = refs.servant ? v.factions[refs.servant] : null;
          const np = f ? this.data.servants[f.servant_id]?.noble_phantasm : null;
          return np ? `‘${np.name_ko}(${np.ruby_ko})’` : '';
        }
        default:
          return `{${key}}`;
      }
    };
    let text = c.line.text.replace(/\{([a-z_]+)\}(?:\{([^}]+)\})?/g, (_m, key: string, pair?: string) => {
      const w = value(key);
      return pair && (JOSA_PAIRS as readonly string[]).includes(pair) ? w + josa(w, pair as JosaPair) : w;
    });
    text = text.replace(/\[image ([a-z0-9_]+)\]/g, (m, k: string) => this.data.labels.image_tokens[k] ?? m).replace(/\s+/g, ' ').trim();

    let speakerName: string | null = null;
    if (c.speaker !== 'narrator') {
      const master = Object.values(this.data.masters).find((m) => m.master_id === c.speaker);
      speakerName = master ? master.name_ko : this.display(faction, new Set());
    }
    return { slot, speaker: c.speaker, speakerName, text, textId: c.textId, status: c.line.status };
  }
}

interface Ctx {
  event: Facts;
  self: string;
  enemy: string | null;
  actor: string | null;
  names: Partial<Record<'actor' | 'target' | 'winner' | 'loser', string>>;
  beat?: Facts;
  phaseWinner?: string | null;
}

const TIERS = ['hostile', 'wary', 'neutral', 'friendly', 'loyal'] as const;
function tierName(v: number) {
  const t = K['affinity.thresholds'];
  let i = 0;
  while (i < t.length && v >= t[i]!) i++;
  return TIERS[i]!;
}
