// PDF: el mosaico no imprime hojas vacías ni vuelve a acomodar las piezas, y la ficha técnica
// imprime lo mismo que muestra la vista previa (ver docs/COMMITS.md).

import { describe, expect, it } from "vitest";
import { samplePath } from "@hilonova/geometry";
import { BLOCK_CATALOG, defaultMeasurementsFor, draftBlock, type BlockKind } from "@hilonova/blocks";
import { flatPages, planTiles, renderPdfTiled, renderTechPack, techPackPageCount, type JsPdfLike } from "@hilonova/export";

/** PDF de mentira que anota lo que se dibuja, página por página. */
function fakePdf() {
  const pages: { texts: string[]; lines: number; rects: number }[] = [{ texts: [], lines: 0, rects: 0 }];
  const cur = () => pages.at(-1)!;
  const pdf: JsPdfLike = {
    internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    setLineWidth: () => {},
    setDrawColor: () => {},
    setFillColor: () => {},
    setFontSize: () => {},
    setLineDashPattern: () => {},
    line: () => void cur().lines++,
    text: (t) => void cur().texts.push(String(t)),
    splitTextToSize: (t) => [t],
    rect: () => void cur().rects++,
    addPage: () => void pages.push({ texts: [], lines: 0, rects: 0 }),
    output: () => new Blob(),
  };
  return { pdf, pages };
}

const docOf = (k: BlockKind) => draftBlock(k, defaultMeasurementsFor(k));
const jean = docOf("pantalon-denim");

describe("mosaico A4", () => {
  it("la primera hoja es de instrucciones: cuadro de 10 cm y mapa", () => {
    const { pdf, pages } = fakePdf();
    renderPdfTiled(pdf, jean);
    expect(pages[0]!.texts.join(" ")).toMatch(/100 %/);
    expect(pages[0]!.texts.join(" ")).toMatch(/10 × 10 cm/);
    // el cuadro de 10 cm + una casilla por cada hoja de la cuadrícula
    const plan = planTiles(jean);
    expect(pages[0]!.rects).toBe(1 + plan.cols * plan.rows);
  });

  it.each(BLOCK_CATALOG.map((b) => b.kind))("%s: ninguna hoja sale en blanco y todo el contorno queda cubierto", (kind) => {
    const doc = docOf(kind);
    const plan = planTiles(doc);
    const { pdf, pages } = fakePdf();
    renderPdfTiled(pdf, doc);
    expect(pages).toHaveLength(plan.sheets.length + 1);
    // cada hoja de patrón dibuja al menos una línea además del marco
    for (const p of pages.slice(1)) expect(p.lines).toBeGreaterThan(0);
    // todo punto del contorno cae dentro de alguna hoja impresa
    for (const piece of doc.pieces) {
      for (const pt of samplePath(piece, 12)) {
        const x = pt.x * 10;
        const y = pt.y * 10;
        const covered = plan.sheets.some((s) => {
          const x0 = plan.originX + s.col * plan.stepX;
          const y0 = plan.originY + s.row * plan.stepY;
          return x >= x0 - 1e-6 && x <= x0 + plan.sheetW + 1e-6 && y >= y0 - 1e-6 && y <= y0 + plan.sheetH + 1e-6;
        });
        expect(covered, `${kind}/${piece.name}`).toBe(true);
      }
    }
  });

  it("no reparte las piezas otra vez: el jean ocupa lo que mide su acomodo en el editor", () => {
    const plan = planTiles(jean);
    const pts = jean.pieces.flatMap((p) => samplePath(p, 12));
    const w = (Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x))) * 10;
    expect(plan.cols).toBeLessThanOrEqual(Math.ceil(w / plan.stepX) + 1);
    // antes eran 150 hojas
    expect(plan.sheets.length).toBeLessThan(70);
  });

  it("las hojas llevan su número y su lugar en la cuadrícula", () => {
    const { pdf, pages } = fakePdf();
    renderPdfTiled(pdf, jean);
    const n = planTiles(jean).sheets.length;
    expect(pages[1]!.texts.join(" ")).toMatch(new RegExp(`hoja 1 de ${n} · columna \\d+, fila \\d+`));
    expect(pages.at(-1)!.texts.join(" ")).toMatch(new RegExp(`hoja ${n} de ${n}`));
  });
});

describe("ficha técnica", () => {
  const meas = jean.sizes.map((size) => ({ size, values: [{ label: "Cintura", value: 80, unit: "cm" }] }));

  it("imprime todos los datos del formulario", () => {
    const { pdf, pages } = fakePdf();
    renderTechPack(pdf, jean, {
      ref: "HLN-DN-012", client: "Taller Lupita", season: "SS26", designer: "Ana Pérez",
      description: "Jean slim de 5 bolsas", notes: "Lavar al revés", measurements: meas,
    });
    const text = pages.map((p) => p.texts.join(" | ")).join(" || ");
    for (const s of ["HLN-DN-012", "Taller Lupita", "SS26", "Ana Pérez", "Jean slim de 5 bolsas", "Lavar al revés"]) expect(text, s).toContain(s);
  });

  it("sin referencia imprime «—», no un número al azar", () => {
    const { pdf, pages } = fakePdf();
    renderTechPack(pdf, jean, { measurements: meas });
    expect(pages[0]!.texts.join(" | ")).not.toMatch(/HLN-\d/);
    expect(pages[0]!.texts).toContain("—");
  });

  it("dibuja las 10 piezas del jean, 4 por hoja", () => {
    expect(jean.pieces).toHaveLength(10);
    expect(flatPages(jean).map((p) => p.length)).toEqual([4, 4, 2]);
    const { pdf, pages } = fakePdf();
    renderTechPack(pdf, jean, { measurements: meas });
    expect(pages).toHaveLength(techPackPageCount(jean));
    const names = pages.flatMap((p) => p.texts).filter((t) => /×\d+ {2}·/.test(t));
    expect(names).toHaveLength(10);
  });

  it("numera las hojas con el total real", () => {
    const { pdf, pages } = fakePdf();
    renderTechPack(pdf, jean, { measurements: meas });
    const total = techPackPageCount(jean);
    pages.forEach((p, i) => expect(p.texts.join(" | ")).toContain(`${i + 1} / ${total} · Generado con Hilonova Studio`));
    expect(pages.flatMap((p) => p.texts).join(" ")).not.toContain("hilonova.mx");
  });

  it("si borras todos los materiales no aparecen los de un jean que no pediste", () => {
    const { pdf, pages } = fakePdf();
    renderTechPack(pdf, jean, { measurements: meas, bom: [] });
    const text = pages.flatMap((p) => p.texts).join(" | ");
    expect(text).not.toMatch(/Cierre|Botón|Remaches/);
    expect(text).toContain("Sin materiales.");
  });

  it("sin materiales editados usa los mismos de ejemplo que la vista previa", () => {
    const { pdf, pages } = fakePdf();
    renderTechPack(pdf, jean, { measurements: meas });
    const text = pages.at(-1)!.texts.join(" | ");
    expect(text).toContain("Tela principal");
    expect(text).toContain("Etiqueta tejida");
    expect(text).not.toMatch(/Cierre|Botón|Remaches/);
  });
});
