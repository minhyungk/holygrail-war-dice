// 판 진행 화면. 구조·연출은 prototype/mockup을 그대로 따른다 (D-072):
// 이벤트를 하나씩 재생 → 서술은 VN 텍스트박스, 내 굴림은 3D 다이스를 직접 던지고 주사위 → 기적 → 보정 → 총합을 한 단계씩,
// 다 보여 준 뒤 선택지(맵 행동 / choices)를 띄운다. 낮 행동 판정도 같은 다이스로 던진다.
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { K, MAP_GRID, PHASES, TILES } from '../../data/constants';
import { tierOf } from '../../engine/affinity';
import type { RollResult } from '../../engine/dice';
import type { AnyEvent, Condition } from '../../engine/events';
import { visible } from '../../engine/map';
import { createRng } from '../../engine/rng';
import type { RunAnswer, RunPrompt, TileRole } from '../../engine/run';
import { parseRank } from '../../engine/stats';
import type { RunView } from '../../engine/view';
import { Art, clsStyle, Glyph, LABELS, Ln, SealIcon, sealSrc } from '../components/common';
import { BattleBackdrop, type Fx, FxLayer } from '../components/BattleFx';
import { RubyText } from '../components/Ruby';
import { type ChoiceOpt, Choices, Vn } from '../components/Vn';
import { REDUCED } from '../fx/circle';
import type { DiceTable } from '../fx/dice3d';
import { displayName, play, type Session, type ShownLine } from '../session';
import { T } from '../strings';
import { End } from './End';

type Side = 'a' | 'c';
interface MathLine {
  key: number;
  left: ReactNode;
  right: ReactNode;
  mir?: boolean;
}
interface Card {
  lines: MathLine[];
  total: string;
  mark: '' | 'win' | 'lose' | 'mid';
  hit: number;
}
const emptyCard = (): Card => ({ lines: [], total: '–', mark: '', hit: 0 });
interface BattleUi {
  id: string;
  enemy: string;
  isFinal: boolean;
}
/** 낮 행동·조우 도주의 판정 상자 */
interface RollBox {
  title: string;
  dc: number | null;
  opponent: boolean;
  result: string | null;
  /** 마력 공급: 목표값 대신 결과 구간표 (mana.md §3.4) */
  bands?: boolean;
}
type StagedRoll = RollResult & { stats?: string[]; parts?: Record<string, number> };
interface ActionRoll {
  title: string;
  mine: StagedRoll;
  dc: number | null;
  opp: StagedRoll | null;
  oppFc: string | null;
  ok: boolean;
  result: string;
  bands?: boolean;
  mark?: Card['mark'];
}

const COND_ORDER: Condition[] = ['danger', 'hurt', 'full'];
const TERRAIN_KO: Record<string, string> = { open: '개활지', urban: '시가지', forest: '숲', river: '수변' };
/** 칸 역할 표시 (D-128) */
const ROLE_ICON: Record<TileRole, string> = { leyline: '✨', intel: '🔍', bond: '💬' };
const tileOf = (id: string) => TILES.find((t) => t.tile_id === id)!;
// 지도 이미지의 격자선 위치(tiles.json image_grid)를 따른다. 칸 크기가 균일하지 않다
const pct = (px: number) => (px / MAP_GRID.size) * 100;
const tokenPos = (id: string, dx = 0) => {
  const t = tileOf(id);
  const x = (MAP_GRID.cols[t.col - 1]! + MAP_GRID.cols[t.col]!) / 2;
  const y = (MAP_GRID.rows[t.row - 1]! + MAP_GRID.rows[t.row]!) / 2;
  return { left: `${pct(x) + dx}%`, top: `${pct(y)}%` };
};
const fr = (lines: number[]) => lines.slice(1).map((v, i) => `${v - lines[i]!}fr`).join(' ');
const GRID_STYLE = {
  inset: `${pct(MAP_GRID.rows[0]!)}% ${100 - pct(MAP_GRID.cols[5]!)}% ${100 - pct(MAP_GRID.rows[5]!)}% ${pct(MAP_GRID.cols[0]!)}%`,
  gridTemplateColumns: fr(MAP_GRID.cols),
  gridTemplateRows: fr(MAP_GRID.rows),
};
const fxRng = createRng(0x51f15e); // 상대 주사위 눈 돌리기 연출용 (결과와 무관)
let lineKey = 0;
/** 텍스트박스에 남겨 두는 줄 수 */
const VN_KEEP = 60;

export function Game({ session, onExit }: { session: Session; onExit: () => void }) {
  const labels = session.labels;
  const [view, setView] = useState<RunView>(session.narrator.state);
  const [vnLog, setVnLog] = useState<ShownLine[]>([]);
  const [typing, setTyping] = useState(false);
  const [history, setHistory] = useState<ShownLine[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [prompt, setPrompt] = useState<RunPrompt | null>(null);
  const [tileInfo, setTileInfo] = useState<string | null>(null);
  const [battle, setBattle] = useState<BattleUi | null>(null);
  const [rollBox, setRollBox] = useState<RollBox | null>(null);
  const [cards, setCards] = useState<Record<Side, Card>>({ a: emptyCard(), c: emptyCard() });
  const [ph, setPh] = useState<{ name: string; no: string }>({ name: '조우', no: '' });
  const [verdict, setVerdict] = useState<string | null>(null);
  const [rollCta, setRollCta] = useState(false);
  const [edge, setEdge] = useState(0);
  const [ended, setEnded] = useState(false);
  // ── 연출 (D-133): 잠깐 떴다 사라지는 효과들 ──
  const [fxList, setFxList] = useState<Fx[]>([]);
  const [trayFx, setTrayFx] = useState<{ id: number; n: number; miracle: boolean } | null>(null);
  const fxSeq = useRef(0);
  const pushFx = (f: Omit<Fx, 'id'>, ms: number) => {
    if (REDUCED) return;
    const id = ++fxSeq.current;
    setFxList((l) => [...l, { ...f, id }]);
    window.setTimeout(() => setFxList((l) => l.filter((x) => x.id !== id)), ms);
  };
  const sideOf = (fc: string): Side => (fc === session.narrator.state.player ? 'a' : 'c');
  const [sealFx, setSealFx] = useState<{ key: number; from: number; to: number; purpose: string; master: string | null } | null>(null);

  const queue = useRef<AnyEvent[]>(session.takeEvents());
  const running = useRef(false);
  const lineDone = useRef<(() => void) | null>(null);
  const throwRes = useRef<((v: [number, number]) => void) | null>(null);
  const tray = useRef<HTMLDivElement>(null);
  const dice = useRef<DiceTable | null>(null);
  const diceReady = useRef<Promise<void>>(Promise.resolve());
  const fast = useRef(false);
  const staged = useRef(false); // 재굴림 선택 때 이미 던져 보여 준 굴림으로 확정했다
  const battleRef = useRef<BattleUi | null>(null);
  battleRef.current = battle;
  const phaseSides = useRef<{ attacker: string; defender: string } | null>(null);
  /** 단독 판정 국면(즉사/우연)의 목표값. 카드 아래에 크게 보인다 */
  const [battleDc, setBattleDc] = useState<number | null>(null);

  const P = view.player;
  const name = useCallback((fc: string, v: RunView = session.narrator.state) => displayName(v, session.data, fc, labels), [session, labels]);
  const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, REDUCED ? 0 : fast.current ? ms * 0.25 : ms));

  // ── VN: 줄이 이어서 흘러나온다 (D-122). 한 줄을 다 치면 다음 줄 ──
  const say = async (lines: ShownLine[]) => {
    if (!lines.length) return;
    setHistory((h) => [...h, ...lines]);
    for (const l of lines) {
      await new Promise<void>((res) => {
        lineDone.current = res;
        setVnLog((v) => [...v, l].slice(-VN_KEEP));
        setTyping(true);
      });
    }
    setTyping(false);
  };
  const onLineDone = useCallback(() => {
    const r = lineDone.current;
    lineDone.current = null;
    r?.();
  }, []);

  // ── 다이스 테이블: 전투 트레이 또는 판정 상자 트레이에 붙는다. three.js는 처음 쓸 때 불러온다 ──
  const trayKey = battle ? `b:${battle.id}` : rollBox ? 'box' : '';
  useEffect(() => {
    if (!trayKey || !tray.current) return;
    const host = tray.current;
    let t: DiceTable | null = null;
    let alive = true;
    diceReady.current = import('../fx/dice3d').then(({ DiceTable: D }) => {
      if (!alive) return;
      t = new D(host);
      dice.current = t;
    });
    return () => {
      alive = false;
      t?.dispose();
      dice.current = null;
    };
  }, [trayKey]);

  const awaitThrow = () =>
    new Promise<[number, number]>((res) => {
      setTrayFx(null); // 지난 굴림의 값이 새 트레이에서 다시 떠오르지 않게
      setRollCta(true);
      throwRes.current = (v) => {
        setRollCta(false);
        throwRes.current = null;
        res(v);
      };
    });
  const swipe = useRef<{ y: number; x: number; t: number } | null>(null);
  const trayHandlers = {
    onPointerDown: (e: React.PointerEvent) => {
      if (!throwRes.current || (e.target as HTMLElement).closest('button')) return;
      swipe.current = { y: e.clientY, x: e.clientX, t: performance.now() };
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = swipe.current;
      swipe.current = null;
      if (!s || !throwRes.current) return;
      const dy = s.y - e.clientY, dx = e.clientX - s.x, dt = Math.max(60, performance.now() - s.t);
      if (dy > 30) throwRes.current([Math.min(1.4, (dy / dt) * 1.2), Math.max(-1, Math.min(1, dx / 150))]);
    },
  };

  const addLn = (side: Side, left: ReactNode, right: ReactNode, mir = false) => {
    const key = ++lineKey;
    setCards((c) => ({ ...c, [side]: { ...c[side], lines: [...c[side].lines, { key, left, right, mir }] } }));
    return key;
  };
  const updateLn = (side: Side, key: number, left: ReactNode, right: ReactNode) =>
    setCards((c) => ({ ...c, [side]: { ...c[side], lines: c[side].lines.map((l) => (l.key === key ? { ...l, left, right } : l)) } }));
  const setTotal = (side: Side, v: string) => setCards((c) => ({ ...c, [side]: { ...c[side], total: v } }));
  const countTo = (side: Side, from: number, to: number, ms: number) =>
    new Promise<void>((res) => {
      if (REDUCED || fast.current) {
        setTotal(side, String(to));
        return res();
      }
      const t0 = performance.now();
      const f = (t: number) => {
        const p = Math.min(1, (t - t0) / ms);
        setTotal(side, String(Math.round((from + (to - from) * p) * 2) / 2));
        if (p < 1) requestAnimationFrame(f);
        else res();
      };
      requestAnimationFrame(f);
    });
  const resetRound = () => {
    setCards((c) => ({ a: { ...emptyCard(), hit: c.a.hit }, c: { ...emptyCard(), hit: c.c.hit } }));
    setVerdict(null);
    setTrayFx(null);
  };
  /** 합산 칩. 내 주사위는 방금 던진 3D 주사위와 같은 색 */
  const chips = (ds: (number | string)[], colors?: string[]) => (
    <span>
      {T.dice}{' '}
      {ds.map((d, i) => (
        <span className={`dchip ${colors?.[i] ? 'colored' : ''}`} key={i} style={colors?.[i] ? ({ ['--dc' as string]: colors[i] } as React.CSSProperties) : undefined}>
          {d}
        </span>
      ))}
    </span>
  );

  /** 보정 이름: 무슨 보정인지 알 수 있게 (예: 호감도 (중립), 정보 (2단계 · 스테이터스)) */
  const partLabel = (k: string, v: number, fc: string) => {
    const f = session.narrator.state.factions[fc];
    if (k === 'affinity' && f && f.affinity !== null) return `${T.part.affinity} (${T.affinityTier[tierOf(f.affinity)]})`;
    if (k === 'intel') return `${T.part.intel} (${v}단계 · ${T.intelLevel[v]})`;
    return T.part[k] ?? k;
  };

  /** 한쪽의 판정을 쌓는다: 주사위 → (기적) → 스탯(랭크) → 기타 보정. 상대 주사위는 눈이 돌다가 멈춘다 */
  const stageSide = async (side: Side, r: StagedRoll, fc: string, mine: boolean) => {
    const v = session.narrator.state;
    const f = v.factions[fc];
    const sv = f ? session.data.servants[f.servant_id]! : null;
    const knowStats = fc === v.player || (v.intel[fc] ?? 0) >= 2;
    if (mine) {
      addLn(side, chips(r.dice, dice.current?.lastColors), r.natural);
      await countTo(side, 0, r.natural, 500);
      await wait(500);
    } else {
      const key = addLn(side, chips(['?', '?']), '…');
      for (let i = 0; i < (REDUCED || fast.current ? 0 : 14); i++) {
        updateLn(side, key, chips([1 + fxRng.int(0, 9), 1 + fxRng.int(0, 9)]), '…');
        await new Promise((res) => window.setTimeout(res, 55));
      }
      updateLn(side, key, chips(r.dice), r.natural);
      await countTo(side, 0, r.natural, 500);
      await wait(400);
    }
    let acc = r.natural;
    if (r.miracle) {
      if (mine) dice.current?.glow(true);
      setEdge((n) => n + 1);
      if (battleRef.current) pushFx({ kind: 'miracle', side }, 1800);
      addLn(side, `${T.miracle} · 자연값 ${r.natural}`, `+${K['dice.miracle_bonus']}`, true);
      await countTo(side, acc, acc + K['dice.miracle_bonus'], 600);
      acc += K['dice.miracle_bonus'];
      await wait(550);
    }
    if (r.stats && sv) {
      for (const k of r.stats) {
        const rank = sv.ranks[k as keyof typeof sv.ranks];
        const val = parseRank(rank).value;
        addLn(side, knowStats ? `${T.stat[k]} ${rank}` : `${T.stat[k]} ?`, `+${val}`);
        await countTo(side, acc, acc + val, 500);
        acc += val;
      }
      for (const [k, val] of Object.entries(r.parts ?? {})) {
        addLn(side, partLabel(k, val, fc), val >= 0 ? `+${val}` : String(val));
        await countTo(side, acc, acc + val, 400);
        acc += val;
      }
      if (r.applied_modifier !== r.modifier) {
        addLn(side, T.part.cap, String(r.applied_modifier - r.modifier));
        await countTo(side, acc, r.total, 400);
      }
    } else {
      addLn(side, T.part.modifier, `+${r.applied_modifier}`);
      await countTo(side, acc, r.total, 650);
    }
    setTotal(side, String(r.total));
    await wait(mine ? 750 : 900);
  };

  const throwMine = async (r: RollResult) => {
    await diceReady.current;
    const [power, dir] = await awaitThrow();
    const animated = dice.current ? await dice.current.roll(r.dice, power, dir) : false;
    fast.current = false; // 던지기 스와이프의 클릭이 빨리감기로 잡히지 않도록 착지 후 초기화
    const landId = ++fxSeq.current;
    setTrayFx({ id: landId, n: r.natural, miracle: r.miracle });
    window.setTimeout(() => setTrayFx((t) => (t?.id === landId ? null : t)), 1400);
    if (!animated) await wait(300);
  };

  // ── 낮 행동·조우 도주 판정 (3D 다이스, 판정 상자) ──
  const actionRollOf = (e: AnyEvent, me: string): ActionRoll | null => {
    const res = (ok: boolean) => (ok ? T.success : T.failure);
    switch (e.type) {
      case 'intel_gained':
        if (e.data.cause !== 'intel' || !e.data.roll) return null;
        return { title: T.actions.intel.label, mine: e.data.roll, dc: e.data.dc, opp: null, oppFc: null, ok: e.data.result === 'success', result: res(e.data.result === 'success') };
      case 'bond':
        return { title: T.actions.bond.label, mine: e.data.roll, dc: e.data.dc, opp: null, oppFc: null, ok: e.data.result === 'success', result: res(e.data.result === 'success') };
      case 'crafted':
        return { title: T.actions.craft.label, mine: e.data.roll, dc: e.data.dc, opp: null, oppFc: null, ok: e.data.result === 'success', result: res(e.data.result === 'success') };
      case 'mana_supplied': {
        const r = e.data.result;
        const mark = r === 'great' || r === 'success' ? 'win' : r === 'normal' ? 'mid' : 'lose';
        return { title: T.actions.supply.label, mine: e.data.roll, dc: null, opp: null, oppFc: null, ok: mark !== 'lose', mark, bands: true, result: `${T.sys.supplyResult[r]!} · 마력 ${e.data.mana_before} → ${e.data.mana_after}` };
      }
      case 'escape_attempted': {
        if (e.data.context !== 'encounter') return null;
        const mine = e.data.rolls.find((r) => r.faction === me);
        const opp = e.data.rolls.find((r) => r.faction !== me);
        if (!mine || !opp) return null;
        const runner = e.data.faction === me;
        return { title: runner ? T.flee : T.chase, mine, dc: null, opp, oppFc: opp.faction, ok: runner ? e.data.success : !e.data.success, result: e.data.success ? T.sys.escapeOk : T.sys.escapeFail };
      }
      default:
        return null;
    }
  };

  const showActionRoll = async (a: ActionRoll) => {
    const me = session.narrator.state.player;
    if (staged.current) staged.current = false; // 재굴림 선택 때 이미 던졌다
    else {
      resetRound();
      setRollBox({ title: a.title, dc: a.dc, opponent: !!a.opp, result: null, bands: a.bands });
      await wait(60);
      await throwMine(a.mine);
      await stageSide('a', a.mine, me, true);
      if (a.opp && a.oppFc) await stageSide('c', a.opp, a.oppFc, false);
    }
    setCards((c) => ({ ...c, a: { ...c.a, mark: a.mark ?? (a.ok ? 'win' : 'lose') } }));
    setRollBox((b) => ({ title: a.title, dc: a.dc, opponent: !!a.opp, bands: a.bands, ...b, result: a.result }));
    await wait(1100);
    setRollBox(null);
  };

  // ── 전투 연출 ──
  const battleFx = async (e: AnyEvent) => {
    const me = session.narrator.state.player;
    switch (e.type) {
      case 'battle_started': {
        if (!e.data.sides.includes(me)) return;
        const enemy = e.data.sides.find((s) => s !== me)!;
        setRollBox(null);
        setVnLog([]); // 전투는 새 글로 시작한다
        setBattle({ id: e.data.battle_id, enemy, isFinal: e.data.is_final });
        setCards({ a: emptyCard(), c: emptyCard() });
        setPh({ name: e.data.is_final ? T.time.final! : '조우', no: '' });
        setVerdict(null);
        await wait(50);
        {
          const v = session.narrator.state;
          const known = (fc: string) => (fc === me ? 3 : (v.intel[fc] ?? 0));
          const clsOf = (fc: string) => (known(fc) >= 1 ? session.data.servants[v.factions[fc]!.servant_id]!.class : null);
          pushFx({ kind: 'vs', a: { name: name(me), cls: clsOf(me) }, c: { name: name(enemy), cls: clsOf(enemy) }, sub: e.data.is_final ? T.time.final : tileOf(e.data.tile ?? v.factions[me]!.tile).name_ko }, 2300);
          await wait(1900);
        }
        return;
      }
      case 'phase_started': {
        if (!battleRef.current || battleRef.current.id !== e.data.battle_id) return;
        resetRound();
        phaseSides.current = { attacker: e.data.attacker, defender: e.data.defender };
        setBattleDc(PHASES[e.data.phase_id].kind === 'solo' ? K['phase.fate_dc'] : null);
        setPh({ name: PHASES[e.data.phase_id].name_ko, no: battleRef.current.isFinal ? T.phaseN(e.data.phase_index) : `${T.phaseN(e.data.phase_index)} / ${K['combat.phase_count']}` });
        pushFx({ kind: 'phase', text: PHASES[e.data.phase_id].name_ko, sub: T.phaseN(e.data.phase_index) }, 1500);
        await wait(1000);
        return;
      }
      case 'phase_rolled': {
        if (!battleRef.current || battleRef.current.id !== e.data.battle_id) return;
        if (staged.current) {
          // 재굴림 선택 때 양쪽을 다 보여 줬다
          staged.current = false;
          return;
        }
        const mine = e.data.rolls.find((r) => r.faction === me);
        const theirs = e.data.rolls.find((r) => r.faction !== me);
        if (mine) {
          await throwMine(mine);
          await stageSide('a', mine, me, true);
        }
        if (theirs) await stageSide('c', theirs, theirs.faction, false);
        return;
      }
      case 'phase_resolved': {
        if (!battleRef.current || battleRef.current.id !== e.data.battle_id) return;
        const solo = PHASES[e.data.phase_id].kind === 'solo';
        if (e.data.defended) {
          // 일방 보구를 막아 냄 (D-120): 버틴 쪽만 금빛, 피해 없음
          const def = phaseSides.current?.defender;
          if (def) setCards((c) => ({ ...c, [def === me ? 'a' : 'c']: { ...c[def === me ? 'a' : 'c'], mark: 'win' } }));
          if (def) pushFx({ kind: 'guard', side: sideOf(def), text: T.fx.guard }, 1300);
          setVerdict(T.verdict.defended(def ? name(def) : ''));
        } else if (e.data.skipped) {
          const def = phaseSides.current?.defender;
          if (solo && def) setCards((c) => ({ ...c, [def === me ? 'a' : 'c']: { ...c[def === me ? 'a' : 'c'], mark: 'win' } }));
          setVerdict(solo ? T.verdict.fateOk : T.verdict.tie);
        } else {
          const win: Side = e.data.winner === me ? 'a' : 'c';
          const lose: Side = win === 'a' ? 'c' : 'a';
          setCards((c) => ({ ...c, [win]: { ...c[win], mark: 'win' } }));
          await wait(600);
          setCards((c) => ({ ...c, [lose]: { ...c[lose], mark: 'lose' } }));
          pushFx({ kind: 'slash', side: lose }, 900);
          const to = e.data.condition_to;
          pushFx({ kind: 'dmg', side: lose, text: to && to !== 'below' ? `▼ ${T.condition[to]}` : T.fx.fall }, 1500);
          await wait(400);
          setVerdict(solo ? T.verdict.fateFail(name(e.data.loser!)) : T.verdict.win(name(e.data.winner!), e.data.margin, e.data.drop));
        }
        await wait(500);
        return;
      }
      case 'condition_changed': {
        if (!battleRef.current || battleRef.current.id !== e.data.battle_id) return;
        const side: Side = e.data.faction === me ? 'a' : 'c';
        setCards((c) => ({ ...c, [side]: { ...c[side], hit: c[side].hit + 1 } }));
        if (e.data.to === 'danger' && side === 'a') pushFx({ kind: 'danger' }, 1700);
        if (e.data.to === 'dead') {
          pushFx({ kind: 'death', side }, 2200);
          await wait(900);
        }
        await wait(700);
        return;
      }
      case 'seal_used': {
        // 화면 중앙에 크게: 영주가 빛나며 한 획 사라진다
        const mine = e.data.faction === me;
        if (!mine && !(battleRef.current && e.data.battle_id === battleRef.current.id)) return;
        const f = session.narrator.state.factions[e.data.faction];
        const master = mine ? null : f?.master_id ? (session.data.masters[f.master_id]?.name_ko ?? '') : '';
        setSealFx({ key: e.seq, from: e.data.seals_left + 1, to: e.data.seals_left, purpose: T.sys.sealPurpose[e.data.purpose]!, master });
        await wait(REDUCED ? 600 : 2100);
        setSealFx(null);
        return;
      }
      case 'np_opened': {
        if (battleRef.current?.id !== e.data.battle_id) return;
        setPh((p) => ({ ...p, name: T.npOpen }));
        const sv = session.data.servants[session.narrator.state.factions[e.data.faction]!.servant_id]!;
        pushFx({ kind: 'np', side: sideOf(e.data.faction), cls: sv.class, text: `‘${sv.noble_phantasm.name_ko}(${sv.noble_phantasm.ruby_ko})’` }, 2600);
        await wait(1700);
        return;
      }
      case 'battle_ended': {
        if (battleRef.current?.id !== e.data.battle_id) return;
        const tone = e.data.result === 'draw' ? 'draw' : e.data.escaped ? 'escape' : e.data.winner === me ? 'win' : 'lose';
        pushFx({ kind: 'result', tone, text: T.sys.battleEnd[tone === 'lose' ? 'loss' : tone]! }, 2200);
        await wait(1500);
        return;
      }
    }
  };

  const run = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      while (queue.current.length) {
        const e = queue.current.shift()!;
        const p = play(session, e, labels);
        setView(p.after);
        const out = !p.after.factions[p.after.player]?.alive && e.type !== 'eliminated';
        if (out) continue; // 탈락 후에는 빨리감기 (D-043)
        if (battleRef.current && (e.type === 'day_started' || e.type === 'night_started' || e.type === 'final_battle_bracket' || e.type === 'moved')) setBattle(null);
        const ar = battleRef.current ? null : actionRollOf(e, p.after.player);
        if (ar) {
          // 글이 먼저 장면을 열고, 그 다음에 주사위를 던진다. 결과(대사·반응·시스템 문구)는 던진 뒤에
          const lead: ShownLine[] = [];
          while (lead.length < p.lines.length && p.lines[lead.length]!.slot === 'lead') lead.push(p.lines[lead.length]!);
          await say(lead);
          await showActionRoll(ar);
          await battleFx(e);
          await say(p.lines.slice(lead.length));
        } else {
          await battleFx(e);
          if (p.lines.length) await say(p.lines);
        }
        if (e.type === 'battle_ended' && battleRef.current?.id === e.data.battle_id) setPh((x) => ({ ...x, name: T.battleOver }));
      }
      if (session.result) {
        setEnded(true);
        return;
      }
      const next = session.pending;
      // 재굴림: 먼저 직접 던지고, 양쪽 결과를 본 뒤 고른다 (dice.md §3.5)
      if (next?.kind === 'reroll') {
        const v = session.narrator.state;
        const me = v.player;
        const inBattle = !!battleRef.current && next.context !== 'action';
        resetRound();
        // 목표값이 없는 낮 행동 판정은 마력 공급뿐이다: 구간표로 보인다
        if (!inBattle) setRollBox({ title: next.context === 'action' && next.dc === null ? T.actions.supply.label : T.rollTitle, dc: next.dc, opponent: !!next.opponent_roll, result: null, bands: next.context === 'action' && next.dc === null });
        await wait(60);
        await throwMine(next.own);
        await stageSide('a', next.own, me, true);
        if (next.opponent_roll) {
          const opp = inBattle ? battleRef.current!.enemy : (Object.values(v.factions).find((f) => f.id !== me && f.alive && f.tile === v.factions[me]!.tile)?.id ?? me);
          await stageSide('c', next.opponent_roll, opp, false);
        }
        // 재굴림은 실패했을 때만 묻는다 (D-119): 지금 굴림은 실패로 표시
        setCards((c) => ({ ...c, a: { ...c.a, mark: 'lose' } }));
      }
      if (next && next.kind === 'action') setBattle(null);
      setPrompt(next);
    } finally {
      running.current = false;
    }
  }, [session, labels]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void run();
  }, [run]);

  const answer = (a: RunAnswer) => {
    // 재굴림하지 않으면 지금 보여 준 굴림으로 확정: 뒤따르는 굴림 이벤트에서 다시 던지지 않는다
    if (prompt?.kind === 'reroll' && a === false) staged.current = true;
    setPrompt(null);
    setTileInfo(null);
    session.answer(a);
    queue.current.push(...session.takeEvents());
    void run();
  };

  if (ended) return <End session={session} view={view} onExit={onExit} />;

  const meF = view.factions[P];
  if (!meF) return null;
  const meSv = session.data.servants[meF.servant_id]!;

  // ── 선택지 (목업 choices) ──
  const choice = ((): { q: string; opts: ChoiceOpt[] } | null => {
    if (!prompt || typing) return null;
    switch (prompt.kind) {
      case 'phase_command': {
        // 국면 지시 (D-127): 마력 보구 개방 / 영주 보구 즉시 발동 / 영주 버프. 마력이 모자라면 이유와 함께 흐리게
        const opts: ChoiceOpt[] = [];
        const need = K['mana.np_threshold'];
        if (prompt.options.includes('np')) opts.push({ label: T.cmd.np(prompt.mana, prompt.mana - K['mana.np_cost']), value: 'np', primary: prompt.enemy_np });
        else if (prompt.enemy_np || prompt.options.includes('seal_np')) opts.push({ label: T.cmd.npLow(prompt.mana, need), value: 'np', blocked: T.cmd.npLowWhy(prompt.mana, need) });
        if (prompt.options.includes('seal_np')) opts.push({ label: T.cmd.sealNp(prompt.seals), value: 'seal_np' });
        if (prompt.options.includes('seal_buff')) opts.push({ label: T.cmd.sealBuff(prompt.seals), value: 'seal_buff' });
        opts.push({ label: prompt.enemy_np ? T.cmd.noneCounter : T.cmd.none, value: 'none', primary: !prompt.enemy_np });
        return { q: prompt.enemy_np ? T.cmd.qCounter : T.cmd.q(prompt.phase_index), opts };
      }
      case 'camp_offer':
        return {
          q: prompt.camp ? T.campQMove(tileOf(prompt.tile).name_ko, tileOf(prompt.camp).name_ko) : T.campQ(tileOf(prompt.tile).name_ko),
          opts: [
            { label: T.campYes, value: true, primary: true },
            { label: T.campNo, value: false },
          ],
        };
      case 'supply_offer':
        return {
          q: prompt.reason === 'hurt' ? T.supplyHurtQ(meSv.name_ko, T.condition[prompt.condition]!) : T.supplyTrustQ(meSv.name_ko),
          opts: [
            { label: T.supplyYes, value: true, primary: true },
            { label: T.supplyNo, value: false },
          ],
        };
      case 'danger_decision':
        // 위험에 들어섰다 (D-134): 여기서 버티면, 한 번 더 맞는 순간 쓰러진다
        return {
          q: T.dangerQ(meSv.name_ko),
          opts: prompt.options.map((o) => ({ label: o === 'fight' ? T.dangerFight : o === 'seal' ? T.escapeSeal(prompt.seals) : T.escapeRun, value: o, primary: o === 'seal' })),
        };
      case 'reroll':
        return {
          q: `${T.total} ${prompt.own.total}${prompt.opponent_total !== null ? ` ${T.vs} ${prompt.opponent_total}` : ''}${prompt.dc !== null ? ` / ${T.dc(prompt.dc)}` : ''} · ${T.rerollQ(prompt.fate_points)}`,
          opts: [
            { label: T.keep, value: false, primary: true },
            { label: T.reroll, value: true },
          ],
        };
      case 'encounter': {
        const f = view.factions[prompt.enemy]!;
        const master = f.master_id ? (session.data.masters[f.master_id]?.name_ko ?? T.unknownMaster) : T.unknownMaster;
        const amb = prompt.ambusher ? (prompt.ambusher === P ? ` ${T.ambushedByMe}` : ` ${T.ambushedByThem}`) : '';
        return {
          q: `${T.encounterBody(name(prompt.enemy, view), master, tileOf(prompt.tile).name_ko)}${amb}`,
          opts: [
            { label: T.fight, value: 'fight', primary: true },
            { label: `${T.flee} (민첩 대항)`, value: 'flee' },
          ],
        };
      }
      case 'post_choice': {
        const f = view.factions[prompt.target]!;
        const master = f.master_id ? (session.data.masters[f.master_id]?.name_ko ?? T.unknownMaster) : T.unknownMaster;
        return {
          q: T.postQ(master),
          opts: [
            { label: T.execute, value: 'execute' },
            { label: T.release, value: 'release' },
          ],
        };
      }
      case 'betrayal_block':
        return {
          q: T.betrayalQ(prompt.seals),
          opts: [
            { label: T.betrayalBlock, value: true, primary: true },
            { label: T.betrayalAccept, value: false },
          ],
        };
      default:
        return null;
    }
  })();

  const actionPrompt = prompt?.kind === 'action' && !typing ? prompt : null;
  const totalActs = view.time === 'night' ? K['day.actions_night'] : K['day.actions_day'];
  const remaining = actionPrompt ? totalActs - actionPrompt.action_index + 1 : Math.max(0, totalActs - view.action);
  const tier = meF.affinity !== null ? tierOf(meF.affinity) : null;
  const curTile = tileOf(meF.tile);

  const onTile = (id: string) => {
    if (actionPrompt?.reachable.includes(id)) return answer({ action: 'move', to: id });
    const t = tileOf(id);
    setTileInfo(`(${t.row},${t.col}) ${t.name_ko} · ${TERRAIN_KO[t.terrain]} · ${ROLE_ICON[t.role]} ${T.role[t.role]}${t.tags.includes('landmark') ? ' · 랜드마크' : ''}${t.tags.includes('center') ? ' · 중앙 (강제 전투 장소)' : ''}`);
  };

  // 낮에는 적 위치가 보이지 않는다 (D-110)
  const enemiesSeen = view.time === 'day' ? [] : Object.values(view.factions).filter((f) => f.id !== P && f.alive && visible(meF.tile, f.tile));

  const statusBits = (
    <>
      <SealIcon n={meF.seals} max={K['combat.command_seals']} />
      <span className="meter mana" title="마력">
        마력{' '}
        <span className="bar">
          <b style={{ width: `${meF.mana}%` }} />
        </span>
        <span className="val">{meF.mana}</span>
      </span>
      {tier && meF.affinity !== null ? (
        <span className="meter aff" title="호감도 (경계 10 · 중립 30 · 호감 50 · 충성 80)">
          호감도{' '}
          <span className="bar">
            <b style={{ width: `${meF.affinity}%`, background: `var(--affinity-${tier})` }} />
            {K['affinity.thresholds'].map((t) => (
              <i key={t} className="tick" style={{ left: `${t}%` }} />
            ))}
          </span>
          <span className="val">
            {meF.affinity} · {T.affinityTier[tier]}
          </span>
        </span>
      ) : null}
      <span className="meter" title="운명점">
        운명점 <span className="val">{meF.fatePoints}</span>
      </span>
    </>
  );

  const rollCtaEl = rollCta ? (
    <div className="roll-cta">
      <p>{matchMedia('(pointer: coarse)').matches ? '위로 쓸어 올려 던지기' : '드래그해서 던지거나 버튼 누르기'}</p>
      <button className="btn primary" onClick={() => throwRes.current?.([0.7, 0])}>
        주사위 굴리기
      </button>
    </div>
  ) : null;

  const rerollInBox = !!rollBox && prompt?.kind === 'reroll' && !typing;

  return (
    <>
      {battle ? (
        <section className={`screen s-battle ${battle.isFinal ? 'final' : ''}`}>
          <BattleBackdrop final={battle.isFinal} />
          <FxLayer fx={fxList} />
          <div className="bhead">
            <b>{ph.name}</b>
            <span>{ph.no}</span>
          </div>
          <div
            className="arena"
            onClick={(e) => {
              if (!(e.target as HTMLElement).closest('button')) fast.current = true;
            }}
          >
            <div className="bcol a">
              <Profile fc={P} view={view} session={session} />
              <FighterCard side="a" fc={P} view={view} session={session} card={cards.a} name={name(P, view)} dc={battleDc !== null && phaseSides.current?.defender === P ? battleDc : null} />
            </div>
            <div className="tray" ref={tray} {...trayHandlers}>
              <div key={edge} className={`edge-flash ${edge ? 'on' : ''}`} />
              {trayFx ? (
                <div key={trayFx.id} className={`tray-land ${trayFx.miracle ? 'mir' : ''}`}>
                  <i className="ring" />
                  <b>{trayFx.n}</b>
                </div>
              ) : null}
              <div className={`verdict ${verdict ? 'in' : ''}`}>{verdict}</div>
              {rollCtaEl}
            </div>
            <div className="bcol c">
              <Profile fc={battle.enemy} view={view} session={session} />
              <FighterCard side="c" fc={battle.enemy} view={view} session={session} card={cards.c} name={name(battle.enemy, view)} dc={battleDc !== null && phaseSides.current?.defender === battle.enemy ? battleDc : null} />
            </div>
          </div>
        </section>
      ) : (
        <section className="screen s-map">
          <div className="hud">
            <div className="hud-day">
              <span>{view.time === 'final' ? T.time.final : `${view.day}일차 · ${T.time[view.time]}`}</span>
              {view.time !== 'final' ? (
                <span className="pips" title="남은 행동">
                  {Array.from({ length: totalActs }, (_, k) => (
                    <i key={k} className={k < remaining ? 'on' : ''} />
                  ))}
                </span>
              ) : null}
            </div>
            <div className="hud-right">
              {statusBits}
              <span className={`tag ${meF.condition}`}>{T.condition[meF.condition]}</span>
            </div>
          </div>
          <div className="map-layout">
            <div>
              <div className="map-wrap">
                <img className="map-img" alt="후유키 시 낮 지도, 5×5 타일" src="./assets/map/fuyuki_tile_day.jpeg" />
                <img className="map-img" alt="후유키 시 밤 지도, 5×5 타일" src="./assets/map/fuyuki_tile_night.jpeg" style={{ opacity: view.time === 'day' ? 0 : 1 }} />
                <div className="map-grid" style={GRID_STYLE}>
                  {TILES.map((t) => {
                    const adj = !!actionPrompt?.reachable.includes(t.tile_id);
                    const fog = view.time !== 'day' && !visible(meF.tile, t.tile_id);
                    const stay = adj && t.tile_id === meF.tile;
                    return (
                      <button
                        key={t.tile_id}
                        className={`tile ${adj ? 'adj' : ''} ${fog ? 'fog' : ''} ${view.camp === t.tile_id ? 'camp' : ''}`}
                        style={{ gridRow: t.row, gridColumn: t.col }}
                        aria-label={`(${t.row},${t.col}) ${t.name_ko} ${TERRAIN_KO[t.terrain]} · ${T.role[t.role]}${stay ? ` · ${T.stayHere}` : ''}`}
                        title={`${t.name_ko} · ${T.role[t.role]}${stay ? ` · ${T.stayHere}` : ''}`}
                        onClick={() => onTile(t.tile_id)}
                      >
                        {view.time === 'day' ? <span className="role-mark" aria-hidden="true">{ROLE_ICON[t.role]}</span> : null}
                        {stay ? <span className="stay-mark">{T.stay}</span> : null}
                      </button>
                    );
                  })}
                </div>
                <div className="token" style={{ ...tokenPos(meF.tile), ...clsStyle(meSv.class) }}>
                  <Art src={meSv.images.face} cls={meSv.class} />
                </div>
                {enemiesSeen.map((f, i) => {
                  const lv = view.intel[f.id] ?? 0;
                  const esv = session.data.servants[f.servant_id]!;
                  return (
                    <div key={f.id} className="token enemy" style={tokenPos(f.tile, f.tile === meF.tile ? 4 + i * 3 : i * 3)}>
                      {lv >= 3 ? <Art src={esv.images.face} cls={esv.class} /> : lv >= 1 ? LABELS.glyph[esv.class] : '?'}
                    </div>
                  );
                })}
                <div className="tile-info">
                  {tileInfo ?? `현재 (${curTile.row},${curTile.col}) · ${curTile.name_ko} · ${TERRAIN_KO[curTile.terrain]} · ${ROLE_ICON[curTile.role]} ${T.role[curTile.role]}${curTile.tags.includes('center') ? ' · 중앙' : ''}`}
                </div>
              </div>
              <p className="hint">{actionPrompt ? (actionPrompt.time === 'day' ? T.pickTileDay : T.pickTile) : ''}</p>
            </div>
            <aside className="side">
              <div className="panel">
                <h4>서번트</h4>
                <div className="me">
                  <Art src={meSv.images.face} cls={meSv.class} />
                  <div>
                    <b>{meSv.name_ko}</b>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {LABELS.cls[meSv.class]} · {T.condition[meF.condition]} · 마력 {meF.mana}
                    </div>
                  </div>
                </div>
              </div>
              <div className="panel intel">
                <h4>적 정보</h4>
                <ul>
                  {Object.values(view.factions)
                    .filter((f) => f.id !== P)
                    .map((f) => {
                      const lv = view.intel[f.id] ?? 0;
                      return (
                        <li key={f.id} className={f.alive ? '' : 'out'}>
                          {name(f.id, view)} <span>{`${lv}단계${lv ? ` · ${T.intelLevel[lv]}` : ''}`}</span>
                        </li>
                      );
                    })}
                </ul>
              </div>
              <div className="panel log">
                <h4>기록</h4>
                <ul>
                  {history
                    .slice(-80)
                    .reverse()
                    .map((l, i) => (
                      <li key={i}>
                        {l.speaker ? <b>{l.speaker}</b> : null}
                        {l.kind === 'system' ? l.text : <RubyText text={l.text} />}
                      </li>
                    ))}
                </ul>
              </div>
            </aside>
          </div>
          <div className="role-legend">
            {(Object.keys(T.role) as TileRole[]).map((r) => (
              <span key={r}>
                {ROLE_ICON[r]} {T.role[r]}
              </span>
            ))}
            <span className="hud-sub">{T.roleHint}</span>
          </div>
        </section>
      )}
      {rollBox && !battle ? (
        <div className="modal roll">
          <div className="box rollbox">
            <h3>{rollBox.title}</h3>
            <div className="tray" ref={tray} {...trayHandlers}>
              <div key={edge} className={`edge-flash ${edge ? 'on' : ''}`} />
              {trayFx ? (
                <div key={trayFx.id} className={`tray-land ${trayFx.miracle ? 'mir' : ''}`}>
                  <i className="ring" />
                  <b>{trayFx.n}</b>
                </div>
              ) : null}
              {rollCtaEl}
            </div>
            <div className={rollBox.opponent ? 'pair' : ''}>
              <MiniCard card={cards.a} title={meSv.name_ko} dc={rollBox.dc} bands={rollBox.bands} />
              {rollBox.opponent ? <MiniCard card={cards.c} title={T.opponent} /> : null}
            </div>
            <div className="result">{rollBox.result}</div>
            {rerollInBox && choice ? (
              <div className="choices-in">
                <div className="hud-sub">{choice.q}</div>
                {choice.opts.map((o, k) => (
                  <button key={k} className={`btn ${o.primary ? 'primary' : ''}`} onClick={() => answer(o.value as RunAnswer)}>
                    {o.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      {/* 전투 화면에서는 글이 계속 남아 있고, 맵에서는 글이 나오는 동안만 보인다 (행동 메뉴를 가리지 않게) */}
      {battle || typing || rollBox ? <Vn log={vnLog} typing={typing} onLineDone={onLineDone} onLog={() => setShowLog(true)} /> : null}
      {choice && !rerollInBox ? <Choices key={JSON.stringify(prompt)} low={!battle} question={choice.q} opts={choice.opts} onPick={(v) => answer(v as RunAnswer)} /> : null}
      {sealFx ? (
        <div className={`seal-burst ${sealFx.master !== null ? 'enemy' : ''}`} key={sealFx.key} aria-live="assertive">
          <div className="sb-ring" />
          <div className="sb-seal">
            <img className="sb-from" src={sealSrc(sealFx.from)} alt="" />
            <img className="sb-to" src={sealSrc(sealFx.to)} alt="" />
          </div>
          <div className="sb-text">
            <b>{sealFx.master !== null ? T.sealBurstEnemy(sealFx.master) : T.sealBurst}</b>
            <span>
              {sealFx.purpose} · {T.sealsLeft(sealFx.to)}
            </span>
          </div>
        </div>
      ) : null}
      {showLog ? (
        <div className="modal" onClick={() => setShowLog(false)}>
          <div className="box" onClick={(e) => e.stopPropagation()}>
            <h3>기록</h3>
            <ul className="loglist">
              {history.map((l, i) => (
                <li key={i}>
                  {l.speaker ? <b>{l.speaker}</b> : null}
                  {l.kind === 'system' ? l.text : <RubyText text={l.text} />}
                </li>
              ))}
            </ul>
            <div className="row">
              <button className="btn" onClick={() => setShowLog(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function MathLines({ card }: { card: Card }) {
  return (
    <div className="math">
      {card.lines.map((l) => (
        <Ln key={l.key}>
          <span className={l.mir ? 'mir' : ''}>{l.left}</span>
          <span className={l.mir ? 'mir' : ''}>{l.right}</span>
        </Ln>
      ))}
    </div>
  );
}

function MiniCard({ card, title, dc, bands }: { card: Card; title: string; dc?: number | null; bands?: boolean }) {
  return (
    <div className={`fcard ${card.mark}`}>
      <div className="who">
        <div className="nm">{title}</div>
      </div>
      <MathLines card={card} />
      <div className="total">
        <small>{T.total}</small>
        <b>{card.total}</b>
      </div>
      {bands ? <BandLadder total={card.total} settled={card.mark !== ''} /> : <Threshold dc={dc ?? null} total={card.total} settled={card.mark !== ''} />}
    </div>
  );
}

/** 마력 공급 결과 구간표: 판정값이 어느 구간에 들어가는지, 구간별 마력·호감도 (mana.md §3.4) */
function BandLadder({ total, settled }: { total: string; settled: boolean }) {
  const bands = K['mana.supply_result'];
  const v = Number(total);
  const hit = settled && !Number.isNaN(v) ? bands.find((b) => v >= b.min)?.result : null;
  const arrow = (d: number) => (d > 0 ? '▲'.repeat(d >= 5 ? 2 : 1) : d < 0 ? '▼'.repeat(d <= -5 ? 2 : 1) : '—');
  return (
    <div className="bands">
      {bands.map((b, i) => {
        const range = i === 0 ? `${b.min} 이상` : i === bands.length - 1 ? `${bands[i - 1]!.min - 1} 이하` : `${b.min}–${bands[i - 1]!.min - 1}`;
        const d = K['affinity.delta_supply'][b.result];
        return (
          <div key={b.result} className={`band ${b.result} ${hit === b.result ? 'hit' : ''}`}>
            <b>{T.sys.supplyResult[b.result]}</b>
            <span className="rng">{range}</span>
            <span>마력 +{b.mana}</span>
            <span className={d > 0 ? 'up' : d < 0 ? 'down' : ''}>
              호감도 {arrow(d)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** 전투 화면 프로필 (서번트 카드 위). 나와 상대가 같은 모양: 얼굴 · 이름 · 한 줄 설명 · 영주 / 마력 막대 */
function Profile({ fc, view, session }: { fc: string; view: RunView; session: Session }) {
  const f = view.factions[fc];
  if (!f) return null;
  const mine = fc === view.player;
  const m = f.master_id ? session.data.masters[f.master_id] : null;
  const name = mine ? T.masterMe : (m?.name_ko ?? T.unknownMaster);
  const sub = mine
    ? `${T.masterLabel} · ${T.affinity} ${f.affinity ?? 0} (${T.affinityTier[tierOf(f.affinity ?? 0)]}) · ${T.fatePoints} ${f.fatePoints}`
    : m
      ? `${T.masterLabel} · ${T.temperament[m.temperament]}`
      : T.masterLabel;
  return (
    <div className={`bprofile ${mine ? 'bp-me' : 'bp-enemy'}`}>
      <div className="bp-head">
        <span className="mb-face" aria-hidden="true">
          {name.slice(0, 1)}
        </span>
        <div className="mb-info">
          <b>{name}</b>
          <small>{sub}</small>
        </div>
        <SealIcon n={f.seals} max={K['combat.command_seals']} />
      </div>
      <div className="bp-meters">
        <span className="meter mana" title="마력">
          마력{' '}
          <span className="bar">
            <b style={{ width: `${f.mana}%` }} />
          </span>
          <span className="val">{f.mana}</span>
        </span>
      </div>
    </div>
  );
}

/** 목표값: 카드 맨 아래에 크게. 판정값이 나오면 넘었는지 색으로 */
function Threshold({ dc, total, settled }: { dc: number | null; total: string; settled: boolean }) {
  if (dc === null) return null;
  const v = Number(total);
  const state = !settled || Number.isNaN(v) ? '' : v >= dc ? 'ok' : 'ng';
  return (
    <div className={`threshold ${state}`}>
      <small>{T.threshold}</small>
      <b>{dc}</b>
    </div>
  );
}

/** 목업 fcard: 이름·클래스, 상태 3칸(위험·부상·만전), 합산 줄, 판정값 */
function FighterCard({ side, fc, view, session, card, name, dc }: { side: Side; fc: string; view: RunView; session: Session; card: Card; name: string; dc?: number | null }) {
  const f = view.factions[fc];
  const [hitAnim, setHitAnim] = useState(false);
  useEffect(() => {
    if (!card.hit) return;
    setHitAnim(false);
    const r = requestAnimationFrame(() => setHitAnim(true));
    return () => cancelAnimationFrame(r);
  }, [card.hit]);
  if (!f) return null;
  const sv = session.data.servants[f.servant_id]!;
  const mine = fc === view.player;
  const lv = mine ? 3 : (view.intel[fc] ?? 0);
  const cond = f.alive ? f.condition : 'danger';
  const n = f.alive ? { full: 3, hurt: 2, danger: 1 }[f.condition] : 0;
  return (
    <div className={`fcard ${side} ${card.mark} ${hitAnim ? 'hit' : ''}`}>
      <div className="who">
        {lv >= 3 ? <Art src={sv.images.face} cls={sv.class} /> : <Glyph cls={sv.class} hidden={lv === 0} />}
        <div style={{ minWidth: 0 }}>
          <div className="nm">{name}</div>
          <div className="cls">
            {mine ? '내 서번트' : '적'} · {lv >= 1 ? LABELS.cls[sv.class] : '?'}
          </div>
        </div>
      </div>
      <div className="cond">
        {[0, 1, 2].map((k) => (
          <i key={k} style={k < n ? { background: `var(--cond-${cond})` } : undefined} />
        ))}
      </div>
      <div className="cond-lbl">
        {COND_ORDER.map((c) => (
          <span key={c} className={f.alive && f.condition === c ? 'cur' : ''}>
            {T.condition[c]}
          </span>
        ))}
      </div>
      <MathLines card={card} />
      <div className="total">
        <small>판정값</small>
        <b>{card.total}</b>
      </div>
      <Threshold dc={dc ?? null} total={card.total} settled={card.mark !== ''} />
    </div>
  );
}
