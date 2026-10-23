// Oferta para alumnos del curso: un mes con el programa completo y 3 exportaciones (cupón de un solo uso, 24 horas).

import { describe, expect, it } from "vitest";
import { EXPORT_KINDS, STUDENT_OFFER } from "../apps/web/app/lib/oferta";
import { PLANS } from "../apps/web/app/lib/auth";

describe("oferta para alumnos", () => {
  it("es un mes, con 3 exportaciones, un cupón de un solo uso que se canjea en 24 horas", () => {
    expect(STUDENT_OFFER).toEqual({ freeMonths: 1, exports: 3, redeemHours: 24, singleUse: true });
  });

  it("el cupón no cambia el precio: el plan sigue siendo uno solo, a $490", () => {
    expect(PLANS).toHaveLength(1);
    expect(PLANS[0]!.priceMxn).toBe(490);
  });

  it("cuenta como exportación lo que sale del programa; el respaldo no se menciona como exportación", () => {
    expect(EXPORT_KINDS).toEqual(["DXF", "PDF", "SVG", "ficha técnica", "trazo"]);
    expect(EXPORT_KINDS.join(" ").toLowerCase()).not.toContain("respaldo");
  });
});
