// OWNED BY T3 (MAP) — 후유키 시 2계층 맵 데이터 (MAP-01/02).
//
// 순수 데이터. 로직은 src/core/systems/{movement,vision}.ts 가 이 배열만 보고 그래프를 만든다.
// 지형은 fuyuki.webp 를 따른다:
//   · 바다 = 북쪽(캔버스 위), 미온 강 = 세로 분단선(x ≈ 460~620)
//   · 미야마초(구도심) = 서안 — 류도지(서쪽 산), 학교 언덕, 주택가(에미야·마토·토오사카), 아인츠베른 숲(남서 외곽)
//   · 신도(신도심) = 동안 — 항만(북동 임해), 중심가(고층지구), 역전, 교회 언덕(남동), 강변공원(남부 하천부지·폐저택)
//   · 도하는 대교 2개(후유키 대교 / 신후유키교)뿐 — 유일한 양안 연결
//
// 캔버스: 세로형 1000 × 1400 (MapViewport T12 가 그대로 쓴다).
// 좌표는 회화적 재배치다 — 원화가 가로형이라 세로 캔버스에 맞춰 남북으로 늘렸다.
// nameKey 규약: `map:district.<id>` / `map:node.<id>` (i18n 콘텐츠는 T16 몫).

import { districtId, nodeId } from "../../core/base";
import type { DistrictId, NodeId } from "../../core/base";
import type {
  DistrictAdjacency,
  DistrictDef,
  LeylineLevel,
  NodeDef,
  NodeKind,
} from "../../core/mapTypes";

/** MapViewport(T12) 기준 캔버스 크기 */
export const MAP_CANVAS = { width: 1000, height: 1400 } as const;

/** 미온 강 (구역이 아니라 배경 도형 — 교량 구역만이 이 띠를 건넌다) */
export const RIVER_PATH =
  "M 470 0 L 620 0 L 640 480 L 610 900 L 660 1400 L 500 1400 L 480 900 L 460 480 Z";

// ─────────────────────────────── 빌더 ───────────────────────────────

interface NodeSpec {
  name: string;
  kind: NodeKind;
  x: number;
  y: number;
  leyline?: LeylineLevel;
  concealMod?: number;
  gateway?: string[];
}

interface DistrictSpec {
  id: string;
  side: DistrictDef["side"];
  traits: DistrictDef["traits"];
  stealthMod: number;
  exposureMod: number;
  supplyMod: number;
  svgPath: string;
  nodes: NodeSpec[];
  /** 노드 이름(접두사 없는 짧은 이름) 쌍 */
  edges: [string, string][];
  adjacent: { to: string; crossRiver?: boolean }[];
}

function buildDistrict(spec: DistrictSpec): DistrictDef {
  const id = districtId(spec.id);
  const nodes: NodeDef[] = spec.nodes.map((node) => {
    const def: NodeDef = {
      id: nodeId(`${spec.id}:${node.name}`),
      district: id,
      nameKey: `map:node.${spec.id}:${node.name}`,
      x: node.x,
      y: node.y,
      kind: node.kind,
      concealMod: node.concealMod ?? 0,
    };
    if (node.leyline !== undefined) def.leyline = node.leyline;
    if (node.gateway) def.gateway = node.gateway.map(districtId);
    return def;
  });

  const adjacent: DistrictAdjacency[] = spec.adjacent.map((a) =>
    a.crossRiver ? { to: districtId(a.to), crossRiver: true } : { to: districtId(a.to) },
  );

  return {
    id,
    nameKey: `map:district.${spec.id}`,
    side: spec.side,
    traits: spec.traits,
    stealthMod: spec.stealthMod,
    exposureMod: spec.exposureMod,
    supplyMod: spec.supplyMod,
    nodes,
    adjacent,
    svgPath: spec.svgPath,
  };
}

/** 구역 내부 간선. buildDistrict 와 같은 spec 에서 뽑아낸다. */
function buildEdges(spec: DistrictSpec): [NodeId, NodeId][] {
  return spec.edges.map(([a, b]) => [
    nodeId(`${spec.id}:${a}`),
    nodeId(`${spec.id}:${b}`),
  ]);
}

// ─────────────────────────────── 구역 정의 ───────────────────────────────

const SPECS: DistrictSpec[] = [
  // ── 미야마측(서안) ────────────────────────────────────────────────
  {
    // 류도지 — 대영맥(3)이자 중립 성역. 점거 가치 최고, 노출도 최고.
    id: "ryuudou",
    side: "miyama",
    traits: ["leyline", "neutral", "exposed"],
    stealthMod: -1,
    exposureMod: 2,
    supplyMod: 0,
    svgPath: "M 30 200 L 240 180 L 258 420 L 215 558 L 40 530 Z",
    nodes: [
      { name: "mountain-gate", kind: "street", x: 215, y: 540, gateway: ["miyama-res", "school-hill"] },
      { name: "stone-steps", kind: "street", x: 155, y: 430, concealMod: 1 },
      { name: "main-hall", kind: "landmark", x: 105, y: 320, leyline: 3, concealMod: -1 },
      { name: "back-shrine", kind: "slot", x: 60, y: 225, concealMod: 2 },
    ],
    edges: [
      ["mountain-gate", "stone-steps"],
      ["stone-steps", "main-hall"],
      ["main-hall", "back-shrine"],
    ],
    adjacent: [{ to: "miyama-res" }, { to: "school-hill" }],
  },
  {
    // 미야마초 주택가 — 저인구·은폐 용이. 토오사카 저택이 영맥 2.
    id: "miyama-res",
    side: "miyama",
    traits: ["stealth"],
    stealthMod: 2,
    exposureMod: -1,
    supplyMod: 0,
    svgPath: "M 250 200 L 450 232 L 470 560 L 440 780 L 330 900 L 265 800 L 258 420 Z",
    nodes: [
      { name: "emiya-house", kind: "landmark", x: 300, y: 255, concealMod: 1 },
      {
        name: "crossroads",
        kind: "street",
        x: 335,
        y: 465,
        gateway: ["ryuudou", "school-hill", "fuyuki-bridge"],
      },
      { name: "matou-manor", kind: "landmark", x: 400, y: 620, concealMod: 2 },
      { name: "tohsaka-manor", kind: "landmark", x: 355, y: 760, leyline: 2 },
      {
        name: "backwoods",
        kind: "slot",
        x: 270,
        y: 845,
        concealMod: 2,
        gateway: ["einzbern-forest", "south-bridge"],
      },
    ],
    edges: [
      ["emiya-house", "crossroads"],
      ["crossroads", "matou-manor"],
      ["matou-manor", "tohsaka-manor"],
      ["tohsaka-manor", "backwoods"],
    ],
    adjacent: [
      { to: "ryuudou" },
      { to: "school-hill" },
      { to: "einzbern-forest" },
      { to: "fuyuki-bridge" },
      { to: "south-bridge" },
    ],
  },
  {
    // 학교 언덕 — 교사 지하에 영맥 2. 밤에는 무인.
    id: "school-hill",
    side: "miyama",
    traits: ["leyline"],
    stealthMod: 0,
    exposureMod: 0,
    supplyMod: 0,
    svgPath: "M 40 560 L 250 560 L 265 800 L 190 880 L 30 852 Z",
    nodes: [
      { name: "front-gate", kind: "street", x: 240, y: 650, gateway: ["ryuudou", "miyama-res"] },
      { name: "courtyard", kind: "landmark", x: 175, y: 710 },
      { name: "main-building", kind: "landmark", x: 115, y: 780, leyline: 2 },
      { name: "boiler-room", kind: "slot", x: 165, y: 845, concealMod: 2 },
      { name: "back-hill", kind: "street", x: 85, y: 860, concealMod: 1, gateway: ["einzbern-forest"] },
    ],
    edges: [
      ["front-gate", "courtyard"],
      ["courtyard", "main-building"],
      ["main-building", "boiler-room"],
      ["main-building", "back-hill"],
      ["boiler-room", "back-hill"],
    ],
    adjacent: [{ to: "ryuudou" }, { to: "miyama-res" }, { to: "einzbern-forest" }],
  },
  {
    // 아인츠베른 숲 — 은폐 최상 / 보급 최악 / 슬롯 다수 (스펙 §9.1)
    id: "einzbern-forest",
    side: "miyama",
    traits: ["stealth"],
    stealthMod: 3,
    exposureMod: -2,
    supplyMod: -2,
    svgPath: "M 30 870 L 190 880 L 330 900 L 312 1080 L 250 1292 L 60 1332 Z",
    nodes: [
      { name: "trailhead", kind: "street", x: 275, y: 930, gateway: ["school-hill", "miyama-res"] },
      { name: "old-road", kind: "street", x: 205, y: 1030, concealMod: 1 },
      { name: "deep", kind: "landmark", x: 135, y: 1140, concealMod: 3 },
      { name: "ruined-castle", kind: "landmark", x: 75, y: 1270, leyline: 1, concealMod: 2 },
      { name: "abandoned-mill", kind: "slot", x: 215, y: 1230, concealMod: 2 },
      { name: "hollow", kind: "slot", x: 300, y: 1090, concealMod: 2, gateway: ["south-bridge"] },
    ],
    edges: [
      ["trailhead", "old-road"],
      ["old-road", "deep"],
      ["deep", "ruined-castle"],
      ["deep", "abandoned-mill"],
      ["abandoned-mill", "ruined-castle"],
      ["trailhead", "hollow"],
      ["hollow", "old-road"],
    ],
    adjacent: [{ to: "school-hill" }, { to: "miyama-res" }, { to: "south-bridge" }],
  },

  // ── 미온 강 (도하 경로) ───────────────────────────────────────────
  {
    // 후유키 대교 — 북쪽 도하. 미야마 주택가 ↔ 신도 중심가.
    id: "fuyuki-bridge",
    side: "river",
    traits: ["chokepoint", "exposed"],
    stealthMod: -3,
    exposureMod: 3,
    supplyMod: -1,
    svgPath: "M 425 590 L 595 375 L 645 415 L 475 625 Z",
    nodes: [
      { name: "west-approach", kind: "street", x: 455, y: 555, gateway: ["miyama-res"] },
      { name: "mid-span", kind: "landmark", x: 535, y: 470, concealMod: -3 },
      { name: "east-approach", kind: "street", x: 615, y: 395, gateway: ["shinto-dt"] },
    ],
    edges: [
      ["west-approach", "mid-span"],
      ["mid-span", "east-approach"],
    ],
    adjacent: [{ to: "miyama-res" }, { to: "shinto-dt", crossRiver: true }],
  },
  {
    // 신후유키교 — 남쪽 도하. 숲·주택가 ↔ 역전·강변공원.
    id: "south-bridge",
    side: "river",
    traits: ["chokepoint", "exposed"],
    stealthMod: -3,
    exposureMod: 3,
    supplyMod: -1,
    svgPath: "M 425 1030 L 595 890 L 645 935 L 475 1072 Z",
    nodes: [
      {
        name: "west-ramp",
        kind: "street",
        x: 450,
        y: 1000,
        gateway: ["miyama-res", "einzbern-forest"],
      },
      { name: "mid-span", kind: "landmark", x: 532, y: 955, concealMod: -3 },
      {
        name: "east-ramp",
        kind: "street",
        x: 615,
        y: 910,
        gateway: ["station", "riverside-park"],
      },
    ],
    edges: [
      ["west-ramp", "mid-span"],
      ["mid-span", "east-ramp"],
    ],
    adjacent: [
      { to: "miyama-res" },
      { to: "einzbern-forest" },
      { to: "station", crossRiver: true },
      { to: "riverside-park", crossRiver: true },
    ],
  },

  // ── 신도측(동안) ─────────────────────────────────────────────────
  {
    // 항만 — 북동 임해. 은폐 양호, 슬롯 다수. 중심가로만 통하는 막다른 구역.
    id: "harbor",
    side: "shinto",
    traits: ["stealth"],
    stealthMod: 2,
    exposureMod: -1,
    supplyMod: 1,
    svgPath: "M 645 140 L 980 112 L 992 330 L 900 402 L 660 380 Z",
    nodes: [
      { name: "customs-office", kind: "street", x: 855, y: 375, gateway: ["shinto-dt"] },
      { name: "container-yard", kind: "street", x: 760, y: 300 },
      { name: "warehouse", kind: "landmark", x: 700, y: 220, concealMod: 2 },
      { name: "pier", kind: "landmark", x: 900, y: 200 },
      { name: "dry-dock", kind: "slot", x: 820, y: 145, concealMod: 1 },
      { name: "sunken-quay", kind: "slot", x: 660, y: 350, concealMod: 2 },
    ],
    edges: [
      ["customs-office", "container-yard"],
      ["container-yard", "warehouse"],
      ["container-yard", "pier"],
      ["warehouse", "dry-dock"],
      ["pier", "dry-dock"],
      ["customs-office", "sunken-quay"],
      ["sunken-quay", "warehouse"],
    ],
    adjacent: [{ to: "shinto-dt" }],
  },
  {
    // 신도 중심가 — 고층지구. 보급 최상 / 은폐 어려움 / 민간 피해 리스크.
    id: "shinto-dt",
    side: "shinto",
    traits: ["crowded"],
    stealthMod: -1,
    exposureMod: 1,
    supplyMod: 2,
    svgPath: "M 640 412 L 900 402 L 986 430 L 976 660 L 700 702 L 626 600 Z",
    nodes: [
      { name: "riverside-road", kind: "street", x: 645, y: 560, gateway: ["fuyuki-bridge"] },
      { name: "central-ave", kind: "street", x: 765, y: 520 },
      { name: "high-rise", kind: "landmark", x: 880, y: 455, gateway: ["harbor"] },
      { name: "department-store", kind: "landmark", x: 830, y: 615 },
      { name: "back-alley", kind: "slot", x: 700, y: 660, concealMod: 2, gateway: ["station"] },
    ],
    edges: [
      ["riverside-road", "central-ave"],
      ["central-ave", "high-rise"],
      ["central-ave", "department-store"],
      ["department-store", "back-alley"],
      ["riverside-road", "back-alley"],
    ],
    adjacent: [{ to: "fuyuki-bridge", crossRiver: true }, { to: "harbor" }, { to: "station" }],
  },
  {
    // 역전 — 유동인구 최대. 신도의 교통 결절점.
    id: "station",
    side: "shinto",
    traits: ["crowded"],
    stealthMod: -1,
    exposureMod: 1,
    supplyMod: 1,
    svgPath: "M 630 722 L 976 660 L 986 880 L 880 932 L 645 900 Z",
    nodes: [
      { name: "west-plaza", kind: "street", x: 650, y: 805, gateway: ["south-bridge"] },
      { name: "station-front", kind: "landmark", x: 760, y: 790 },
      { name: "concourse", kind: "street", x: 800, y: 725, gateway: ["shinto-dt"] },
      { name: "north-road", kind: "street", x: 930, y: 730 },
      { name: "underpass", kind: "slot", x: 705, y: 880, concealMod: 2, gateway: ["riverside-park"] },
      { name: "east-avenue", kind: "street", x: 900, y: 865, gateway: ["church-hill"] },
    ],
    edges: [
      ["west-plaza", "station-front"],
      ["station-front", "concourse"],
      ["concourse", "north-road"],
      ["station-front", "underpass"],
      ["station-front", "east-avenue"],
      ["north-road", "east-avenue"],
    ],
    adjacent: [
      { to: "south-bridge", crossRiver: true },
      { to: "shinto-dt" },
      { to: "church-hill" },
      { to: "riverside-park" },
    ],
  },
  {
    // 교회 언덕 — 감독역 상주. 중립지, 계약 공증 장소.
    id: "church-hill",
    side: "shinto",
    traits: ["neutral"],
    stealthMod: 0,
    exposureMod: 0,
    supplyMod: 1,
    svgPath: "M 800 942 L 986 892 L 992 1150 L 900 1232 L 790 1180 Z",
    nodes: [
      { name: "hill-road", kind: "street", x: 855, y: 955, gateway: ["station"] },
      { name: "church", kind: "landmark", x: 920, y: 1055, leyline: 1 },
      { name: "graveyard", kind: "landmark", x: 830, y: 1140, concealMod: 1, gateway: ["riverside-park"] },
      { name: "catacombs", kind: "slot", x: 950, y: 1160, concealMod: 2 },
    ],
    edges: [
      ["hill-road", "church"],
      ["church", "graveyard"],
      ["church", "catacombs"],
      ["graveyard", "catacombs"],
    ],
    adjacent: [{ to: "station" }, { to: "riverside-park" }],
  },
  {
    // 강변공원 — 하천부지 개활지. 은폐 불가, 사선이 길어 아처가 유리(archerFavor).
    id: "riverside-park",
    side: "shinto",
    traits: ["exposed", "archerFavor"],
    stealthMod: -2,
    exposureMod: 2,
    supplyMod: 0,
    svgPath: "M 600 1002 L 700 942 L 800 1010 L 790 1180 L 760 1332 L 620 1342 Z",
    nodes: [
      {
        name: "north-walk",
        kind: "street",
        x: 660,
        y: 1045,
        concealMod: -1,
        gateway: ["station", "south-bridge"],
      },
      { name: "open-lawn", kind: "landmark", x: 705, y: 1160, concealMod: -2 },
      { name: "east-path", kind: "street", x: 785, y: 1130, gateway: ["church-hill"] },
      { name: "ghost-house", kind: "landmark", x: 750, y: 1275, concealMod: 2 },
      { name: "water-gate", kind: "slot", x: 630, y: 1250, concealMod: 1 },
    ],
    edges: [
      ["north-walk", "open-lawn"],
      ["open-lawn", "east-path"],
      ["open-lawn", "ghost-house"],
      ["open-lawn", "water-gate"],
      ["north-walk", "water-gate"],
    ],
    adjacent: [
      { to: "south-bridge", crossRiver: true },
      { to: "station" },
      { to: "church-hill" },
    ],
  },
];

// ─────────────────────────────── 파생 export ───────────────────────────────

export const FUYUKI_DISTRICTS: DistrictDef[] = SPECS.map(buildDistrict);

/** 구역 내부 간선 (구역 간 간선은 gateway 로부터 movement.ts 가 만든다) */
export const INTRA_DISTRICT_EDGES: Record<string, [NodeId, NodeId][]> = (() => {
  const out: Record<string, [NodeId, NodeId][]> = {};
  for (const spec of SPECS) out[spec.id] = buildEdges(spec);
  return out;
})();

export const ALL_NODES: NodeDef[] = FUYUKI_DISTRICTS.flatMap((d) => d.nodes);

export const NODE_BY_ID: Map<NodeId, NodeDef> = new Map(ALL_NODES.map((n) => [n.id, n]));

export const DISTRICT_BY_ID: Map<DistrictId, DistrictDef> = new Map(
  FUYUKI_DISTRICTS.map((d) => [d.id, d]),
);

export const DISTRICT_OF_NODE: Map<NodeId, DistrictId> = new Map(
  ALL_NODES.map((n) => [n.id, n.district]),
);

/** 슬롯(미개방) 노드 — 초기화 시 내용물이 배정된다 (MAP-03) */
export const SLOT_NODES: NodeDef[] = ALL_NODES.filter((n) => n.kind === "slot");

/** 영맥 노드 (기본값. 슬롯 개봉으로 늘어날 수 있다) */
export const LEYLINE_NODES: NodeDef[] = ALL_NODES.filter((n) => n.leyline !== undefined);

/**
 * 진영 7개의 권장 시작 노드 (거점 성격이 다른 구역으로 흩어 놓는다).
 * INTEGRATION(orchestrator): createInitialState 의 startNode 배정에 사용.
 */
export const START_NODES: NodeId[] = [
  nodeId("miyama-res:tohsaka-manor"),
  nodeId("miyama-res:emiya-house"),
  nodeId("ryuudou:main-hall"),
  nodeId("einzbern-forest:deep"),
  nodeId("shinto-dt:department-store"),
  nodeId("harbor:warehouse"),
  nodeId("church-hill:church"),
];
