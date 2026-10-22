// Ayudantes compartidos por las pruebas: lector de DXF y geometría de polígonos.

export interface V { x: number; y: number }

// ─── polígonos ───────────────────────────────────────────────────────────────

export function polyArea(pts: readonly V[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!;
    const b = pts[(i + 1) % pts.length]!;
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}

export function pointInPoly(p: V, poly: readonly V[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!;
    const b = poly[j]!;
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

export function distToSegment(p: V, a: V, b: V): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  const u = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - (a.x + u * dx), p.y - (a.y + u * dy));
}

export function distToPoly(p: V, poly: readonly V[]): number {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    best = Math.min(best, distToSegment(p, poly[i]!, poly[(i + 1) % poly.length]!));
  }
  return best;
}

export function bbox(pts: readonly V[]) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
  }
  return { minX, minY, maxX, maxY };
}

// ─── lector de DXF (R12, ASCII) ──────────────────────────────────────────────

export interface DxfEntity {
  type: string;
  layer: string | undefined;
  data: Array<[string, string]>;
}

export interface DxfPoly {
  layer: string;
  closed: boolean;
  pts: V[];
}

export interface ParsedDxf {
  oddLines: boolean;
  pairs: Array<[string, string]>;
  sections: string[];
  endsec: number;
  endsWithEof: boolean;
  header: Record<string, string>;
  declaredLayers: string[];
  entities: DxfEntity[];
  polys: DxfPoly[];
  lines: Array<{ layer: string; a: V; b: V }>;
  texts: string[];
  raw: string;
}

export function parseDxf(raw: string): ParsedDxf {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i + 1 < lines.length; i += 2) pairs.push([lines[i]!.trim(), lines[i + 1]!]);

  const sections: string[] = [];
  let endsec = 0;
  const header: Record<string, string> = {};
  const declaredLayers: string[] = [];
  for (let i = 0; i < pairs.length; i++) {
    const [c, v] = pairs[i]!;
    if (c === "0" && v.trim() === "SECTION" && pairs[i + 1]![0] === "2") sections.push(pairs[i + 1]![1].trim());
    if (c === "0" && v.trim() === "ENDSEC") endsec++;
    if (c === "9") header[v.trim()] = pairs[i + 1]![1].trim();
    if (c === "0" && v.trim() === "LAYER" && pairs[i + 1]![0] === "2") declaredLayers.push(pairs[i + 1]![1].trim());
  }

  const kinds = new Set(["LWPOLYLINE", "LINE", "TEXT", "POLYLINE", "VERTEX", "SEQEND", "CIRCLE", "ARC"]);
  const entities: DxfEntity[] = [];
  for (let i = 0; i < pairs.length; i++) {
    const [c, v] = pairs[i]!;
    if (c === "0" && kinds.has(v.trim())) {
      const data: Array<[string, string]> = [];
      i++;
      while (i < pairs.length && pairs[i]![0] !== "0") data.push(pairs[i++]!);
      i--;
      entities.push({ type: v.trim(), layer: data.find(([k]) => k === "8")?.[1].trim(), data });
    }
  }
  const get = (e: DxfEntity, code: string) => e.data.find(([k]) => k === code)?.[1];

  const polys: DxfPoly[] = [];
  let cur: DxfPoly | null = null;
  for (const e of entities) {
    if (e.type === "POLYLINE") cur = { layer: e.layer ?? "", closed: (Number(get(e, "70") ?? 0) & 1) === 1, pts: [] };
    else if (e.type === "VERTEX" && cur) cur.pts.push({ x: Number(get(e, "10")), y: Number(get(e, "20")) });
    else if (e.type === "SEQEND" && cur) { polys.push(cur); cur = null; }
  }

  return {
    oddLines: lines.length % 2 === 1,
    pairs,
    sections,
    endsec,
    endsWithEof: pairs.length > 0 && pairs[pairs.length - 1]![0] === "0" && pairs[pairs.length - 1]![1] === "EOF",
    header,
    declaredLayers,
    entities,
    polys,
    lines: entities
      .filter((e) => e.type === "LINE")
      .map((e) => ({
        layer: e.layer ?? "",
        a: { x: Number(get(e, "10")), y: Number(get(e, "20")) },
        b: { x: Number(get(e, "11")), y: Number(get(e, "21")) },
      })),
    texts: entities.filter((e) => e.type === "TEXT").map((e) => get(e, "1") ?? ""),
    raw,
  };
}
