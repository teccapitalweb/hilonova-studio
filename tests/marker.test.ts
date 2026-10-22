import { describe, expect, it } from "vitest";
import { exportMarkerDxf, exportMarkerSvg, markerPdfPlan, renderMarkerPdf, type JsPdfLike } from "@hilonova/export";
import { BLOCK_CATALOG, defaultMeasurementsFor, draftBlock, type BlockKind } from "@hilonova/blocks";
import { markerLayoutOf, nestBySize, nestPieces } from "../apps/web/app/studio/nesting";
import { parseDxf, polyArea } from "./helpers";

const docOf = (k: BlockKind) => draftBlock(k, defaultMeasurementsFor(k));
const W = 150;

function layoutOf(kind: BlockKind, combined = false) {
  const doc = docOf(kind);
  if (combined) {
    const { combined: r } = nestBySize(doc, W);
    return { doc, r, layout: markerLayoutOf(r, W, `${doc.name} - combinado`) };
  }
  const r = nestPieces(doc.pieces, W);
  return { doc, r, layout: markerLayoutOf(r, W, `${doc.name} - trazo`) };
}

describe("trazo: DXF", () => {
  it("tiene estructura R12 válida, ASCII y capas declaradas", () => {
    const { layout } = layoutOf("blusa-clasica");
    const dxf = exportMarkerDxf(layout);
    const d = parseDxf(dxf);
    expect(d.oddLines).toBe(false);
    expect(d.sections).toEqual(["HEADER", "TABLES", "ENTITIES"]);
    expect(d.endsec).toBe(3);
    expect(d.endsWithEof).toBe(true);
    expect(d.header["$ACADVER"]).toBe("AC1009");
    expect(d.declaredLayers).toContain("20_Fabric");
    expect(/[^\x00-\x7F]/.test(dxf)).toBe(false);
    for (const e of d.entities) {
      if (e.type === "VERTEX" || e.type === "SEQEND") continue;
      expect(d.declaredLayers).toContain(e.layer);
    }
  });

  it("trae el borde de la tela y dos contornos por pieza (línea de la pieza y de corte)", () => {
    const { layout, r } = layoutOf("blusa-clasica");
    const d = parseDxf(exportMarkerDxf(layout));
    const fabric = d.polys.filter((p) => p.layer === "20_Fabric");
    expect(fabric).toHaveLength(1);
    const xs = fabric[0]!.pts.map((p) => p.x);
    const ys = fabric[0]!.pts.map((p) => -p.y); // el DXF invierte Y
    expect(Math.max(...xs)).toBeCloseTo(W, 3);
    expect(Math.max(...ys)).toBeCloseTo(r.markerLength, 3);
    expect(d.polys.filter((p) => p.layer === "1_Boundary")).toHaveLength(r.placed.length);
    expect(d.polys.filter((p) => p.layer === "15_SeamAllowance")).toHaveLength(r.placed.length);
  });

  it("todas las piezas quedan dentro de la tela", () => {
    const { layout, r } = layoutOf("chamarra-mezclilla");
    const d = parseDxf(exportMarkerDxf(layout));
    for (const p of d.polys.filter((q) => q.layer !== "20_Fabric")) {
      for (const v of p.pts) {
        expect(v.x).toBeGreaterThanOrEqual(-1e-3);
        expect(v.x).toBeLessThanOrEqual(W + 1e-3);
        expect(-v.y).toBeGreaterThanOrEqual(-1e-3);
        expect(-v.y).toBeLessThanOrEqual(r.markerLength + 1e-3);
      }
    }
  });

  it("el contorno de corte envuelve a la línea de la pieza", () => {
    const { layout } = layoutOf("polo");
    const d = parseDxf(exportMarkerDxf(layout));
    const inner = d.polys.filter((p) => p.layer === "1_Boundary");
    const cut = d.polys.filter((p) => p.layer === "15_SeamAllowance");
    inner.forEach((p, i) => expect(polyArea(cut[i]!.pts)).toBeGreaterThan(polyArea(p.pts)));
  });

  it("incluye hilo por pieza, piquetes y rótulos", () => {
    const { layout, r } = layoutOf("camisa-hombre");
    const d = parseDxf(exportMarkerDxf(layout));
    expect(d.lines.filter((l) => l.layer === "5_Grainline")).toHaveLength(r.placed.length);
    const notches = r.placed.reduce((s, p) => s + p.notches.length, 0);
    expect(notches).toBeGreaterThan(0);
    expect(d.lines.filter((l) => l.layer === "4_Notch")).toHaveLength(notches);
    // un rótulo por pieza + el título
    expect(d.texts).toHaveLength(r.placed.length + 1);
  });

  it("el trazo combinado rotula cada pieza con su talla", () => {
    const { layout, doc } = layoutOf("blusa-clasica", true);
    const d = parseDxf(exportMarkerDxf(layout));
    for (const s of doc.sizes) expect(d.texts.some((t) => t.endsWith(`TALLA ${s}`)), `talla ${s}`).toBe(true);
  });

  it("los piquetes caen sobre el contorno de su pieza", () => {
    const { r } = layoutOf("blusa-clasica");
    for (const pp of r.placed) {
      for (const n of pp.notches) {
        const near = Math.min(...pp.inner.map((q) => Math.hypot(q.x - n.x, q.y - n.y)));
        expect(near, `${pp.piece.name}: piquete lejos del contorno`).toBeLessThan(1.5);
      }
    }
  });

  it.each(BLOCK_CATALOG.map((b) => [b.kind] as const))("%s se exporta", (kind) => {
    const { layout } = layoutOf(kind);
    const d = parseDxf(exportMarkerDxf(layout));
    expect(d.endsWithEof).toBe(true);
    expect(d.polys.length).toBeGreaterThan(0);
  });
});

describe("trazo: SVG", () => {
  it("va a escala 1:1: milímetros reales y viewBox en cm", () => {
    const { layout, r } = layoutOf("blusa-clasica");
    const svg = exportMarkerSvg(layout);
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain(`width="${(W * 10).toFixed(1)}mm"`);
    expect(svg).toContain(`viewBox="0 -4 ${W} ${r.markerLength + 4}"`);
    expect((svg.match(/class="cut"/g) ?? []).length).toBe(r.placed.length);
    expect((svg.match(/class="grain"/g) ?? []).length).toBe(r.placed.length);
    expect(svg).toContain("</svg>");
  });

  it("escapa los caracteres especiales de los nombres", () => {
    const { layout } = layoutOf("blusa-clasica");
    layout.pieces[0]!.name = 'Pieza <A> & "B"';
    const svg = exportMarkerSvg(layout);
    expect(svg).not.toContain("<A>");
    expect(svg).toContain("&lt;A&gt; &amp;");
  });
});

describe("trazo: PDF a escala 1:1", () => {
  function fakePdf() {
    const calls: Array<{ fn: string; args: unknown[] }> = [];
    const rec = (fn: string) => (...args: unknown[]) => { calls.push({ fn, args }); };
    const pdf = {
      internal: { pageSize: { getWidth: () => 0, getHeight: () => 0 } },
      setLineWidth: rec("setLineWidth"), setDrawColor: rec("setDrawColor"), setFontSize: rec("setFontSize"),
      setLineDashPattern: rec("setLineDashPattern"), line: rec("line"), text: rec("text"), rect: rec("rect"),
      addPage: rec("addPage"), output: () => new Blob(),
    } as unknown as JsPdfLike;
    return { pdf, calls };
  }

  it("el tamaño de página es el del trazo más márgenes (en mm)", () => {
    const { layout } = layoutOf("blusa-clasica");
    const plan = markerPdfPlan(layout);
    expect(plan.pageW).toBeCloseTo(W * 10 + 24, 3);
    expect(plan.pages).toBe(1);
    expect(plan.pageH).toBeCloseTo(layout.length * 10 + 24 + 10, 3);
  });

  it("dibuja a 1:1: el borde de la tela mide ancho × 10 mm y la regla de control 100 mm", () => {
    const { layout } = layoutOf("blusa-clasica");
    const { pdf, calls } = fakePdf();
    renderMarkerPdf(pdf, layout);
    const rect = calls.find((c) => c.fn === "rect")!;
    expect(rect.args[2]).toBeCloseTo(W * 10, 3);
    expect(rect.args[3]).toBeCloseTo(layout.length * 10, 3);
    const lines = calls.filter((c) => c.fn === "line").map((c) => c.args as number[]);
    expect(lines.some(([x1, y1, x2, y2]) => Math.abs(x2! - x1! - 100) < 1e-6 && y1 === y2)).toBe(true);
  });

  it("un trazo muy largo se reparte en varias páginas", () => {
    const { layout } = layoutOf("blusa-clasica", true);
    const long = { ...layout, length: 1200 }; // 12 m
    const plan = markerPdfPlan(long, { maxPageHeight: 5000 });
    expect(plan.pages).toBeGreaterThan(2);
    const { pdf, calls } = fakePdf();
    renderMarkerPdf(pdf, long, { maxPageHeight: 5000 });
    expect(calls.filter((c) => c.fn === "addPage")).toHaveLength(plan.pages - 1);
  });

  it("los textos del PDF son ASCII", () => {
    const { layout } = layoutOf("camisa-hombre");
    const { pdf, calls } = fakePdf();
    renderMarkerPdf(pdf, layout);
    for (const c of calls.filter((x) => x.fn === "text")) expect(/[^\x00-\x7F]/.test(String(c.args[0]))).toBe(false);
  });
});
