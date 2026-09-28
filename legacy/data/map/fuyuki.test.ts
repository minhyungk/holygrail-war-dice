// OWNED BY T3 (MAP) — 후유키 맵 데이터 정합성.
import { describe, it, expect } from "vitest";
import type { DistrictId, NodeId } from "../../core/base";
import {
  ALL_NODES,
  DISTRICT_BY_ID,
  DISTRICT_OF_NODE,
  FUYUKI_DISTRICTS,
  INTRA_DISTRICT_EDGES,
  MAP_CANVAS,
  NODE_BY_ID,
  START_NODES,
} from "./fuyuki";

const BRIDGE_IDS = ["fuyuki-bridge", "south-bridge"];

describe("fuyuki map data", () => {
  it("has exactly 11 districts", () => {
    expect(FUYUKI_DISTRICTS).toHaveLength(11);
  });

  it("covers the districts named in the spec", () => {
    const ids = FUYUKI_DISTRICTS.map((d) => String(d.id)).sort();
    expect(ids).toEqual(
      [
        "church-hill",
        "einzbern-forest",
        "fuyuki-bridge",
        "harbor",
        "miyama-res",
        "riverside-park",
        "ryuudou",
        "school-hill",
        "shinto-dt",
        "south-bridge",
        "station",
      ].sort(),
    );
  });

  it("gives every district 3~6 nodes", () => {
    for (const district of FUYUKI_DISTRICTS) {
      expect(district.nodes.length).toBeGreaterThanOrEqual(3);
      expect(district.nodes.length).toBeLessThanOrEqual(6);
    }
  });

  it("has unique node ids and consistent lookup maps", () => {
    const ids = ALL_NODES.map((n) => String(n.id));
    expect(new Set(ids).size).toBe(ids.length);
    expect(NODE_BY_ID.size).toBe(ALL_NODES.length);
    expect(DISTRICT_OF_NODE.size).toBe(ALL_NODES.length);
    for (const node of ALL_NODES) {
      expect(DISTRICT_OF_NODE.get(node.id)).toBe(node.district);
      expect(String(node.id).startsWith(`${String(node.district)}:`)).toBe(true);
      expect(node.nameKey).toBe(`map:node.${String(node.id)}`);
    }
    for (const district of FUYUKI_DISTRICTS) {
      expect(district.nameKey).toBe(`map:district.${String(district.id)}`);
    }
  });

  it("keeps every node inside the portrait canvas", () => {
    for (const node of ALL_NODES) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.x).toBeLessThanOrEqual(MAP_CANVAS.width);
      expect(node.y).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeLessThanOrEqual(MAP_CANVAS.height);
    }
  });

  it("puts miyama west of the river and shinto east of it", () => {
    for (const district of FUYUKI_DISTRICTS) {
      const avgX =
        district.nodes.reduce((sum, n) => sum + n.x, 0) / district.nodes.length;
      if (district.side === "miyama") expect(avgX).toBeLessThan(500);
      if (district.side === "shinto") expect(avgX).toBeGreaterThan(500);
    }
  });

  it("gives every non-river district 1~2 slot nodes and rivers none", () => {
    for (const district of FUYUKI_DISTRICTS) {
      const slots = district.nodes.filter((n) => n.kind === "slot").length;
      if (district.side === "river") {
        expect(slots).toBe(0);
      } else {
        expect(slots).toBeGreaterThanOrEqual(1);
        expect(slots).toBeLessThanOrEqual(2);
      }
    }
  });

  it("declares closed svg paths for every district", () => {
    for (const district of FUYUKI_DISTRICTS) {
      expect(district.svgPath.startsWith("M ")).toBe(true);
      expect(district.svgPath.trim().endsWith("Z")).toBe(true);
    }
  });

  it("references only existing nodes in intra-district edges", () => {
    for (const district of FUYUKI_DISTRICTS) {
      const edges = INTRA_DISTRICT_EDGES[String(district.id)];
      expect(edges).toBeDefined();
      for (const [a, b] of edges) {
        expect(NODE_BY_ID.has(a)).toBe(true);
        expect(NODE_BY_ID.has(b)).toBe(true);
        expect(DISTRICT_OF_NODE.get(a)).toBe(district.id);
        expect(DISTRICT_OF_NODE.get(b)).toBe(district.id);
        expect(a).not.toBe(b);
      }
    }
  });

  it("keeps district adjacency symmetric (including crossRiver flags)", () => {
    for (const district of FUYUKI_DISTRICTS) {
      for (const adjacency of district.adjacent) {
        const other = DISTRICT_BY_ID.get(adjacency.to);
        expect(other, `${String(adjacency.to)} must exist`).toBeDefined();
        const back = other?.adjacent.find((a) => a.to === district.id);
        expect(back, `${String(other?.id)} → ${String(district.id)}`).toBeDefined();
        expect(back?.crossRiver === true).toBe(adjacency.crossRiver === true);
      }
    }
  });

  it("provides gateway nodes on both sides of every district adjacency", () => {
    for (const district of FUYUKI_DISTRICTS) {
      for (const adjacency of district.adjacent) {
        const other = DISTRICT_BY_ID.get(adjacency.to);
        expect(district.nodes.some((n) => n.gateway?.includes(adjacency.to))).toBe(true);
        expect(other?.nodes.some((n) => n.gateway?.includes(district.id))).toBe(true);
      }
    }
  });

  it("only lets the two bridge districts cross the river", () => {
    for (const district of FUYUKI_DISTRICTS) {
      for (const adjacency of district.adjacent) {
        const other = DISTRICT_BY_ID.get(adjacency.to);
        if (!other) continue;
        const differentSides =
          district.side !== "river" &&
          other.side !== "river" &&
          district.side !== other.side;
        // 강 양안을 직접 잇는 변은 존재하지 않는다
        expect(differentSides).toBe(false);
        if (adjacency.crossRiver) {
          expect(district.side === "river" || other.side === "river").toBe(true);
        }
      }
    }
  });

  it("connects the whole district graph, and disconnects the sides without the bridges", () => {
    const reach = (blocked: string[]): Set<string> => {
      const start = FUYUKI_DISTRICTS.find(
        (d) => d.side === "miyama" && !blocked.includes(String(d.id)),
      );
      const seen = new Set<string>();
      if (!start) return seen;
      const queue: DistrictId[] = [start.id];
      seen.add(String(start.id));
      for (let head = 0; head < queue.length; head++) {
        const district = DISTRICT_BY_ID.get(queue[head]);
        for (const adjacency of district?.adjacent ?? []) {
          const key = String(adjacency.to);
          if (blocked.includes(key) || seen.has(key)) continue;
          seen.add(key);
          queue.push(adjacency.to);
        }
      }
      return seen;
    };

    expect(reach([]).size).toBe(FUYUKI_DISTRICTS.length);

    const withoutBridges = reach(BRIDGE_IDS);
    for (const district of FUYUKI_DISTRICTS) {
      if (district.side === "shinto") {
        expect(withoutBridges.has(String(district.id))).toBe(false);
      }
    }
    // 미야마측 4구역은 여전히 서로 연결돼 있어야 한다
    expect(withoutBridges.size).toBe(
      FUYUKI_DISTRICTS.filter((d) => d.side === "miyama").length,
    );
  });

  it("places leylines on the landmarks the spec calls out", () => {
    const leyline = (id: string): number =>
      NODE_BY_ID.get(id as NodeId)?.leyline ?? 0;
    expect(leyline("ryuudou:main-hall")).toBe(3);
    expect(leyline("miyama-res:tohsaka-manor")).toBe(2);
    expect(leyline("school-hill:main-building")).toBe(2);
  });

  it("keeps the T1 placeholder node real", () => {
    expect(NODE_BY_ID.has("miyama-res:crossroads" as NodeId)).toBe(true);
  });

  it("lists 7 distinct start nodes that all exist", () => {
    expect(START_NODES).toHaveLength(7);
    expect(new Set(START_NODES.map(String)).size).toBe(7);
    for (const node of START_NODES) expect(NODE_BY_ID.has(node)).toBe(true);
  });
});
