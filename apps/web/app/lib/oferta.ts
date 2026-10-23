// Oferta para los alumnos del curso. Es la única fuente de estos números: la pantalla de planes, la página
// principal y las pruebas los leen de aquí. Todavía no se aplica (no hay cobro ni cuentas): se aplicará con un
// cupón de Stripe cuando existan.

export const STUDENT_OFFER = {
  /** meses gratis con el programa completo */
  freeMonths: 1,
  /** exportaciones permitidas durante el mes gratis (en total) */
  exports: 3,
  /** horas que tiene el alumno para canjear el cupón desde que lo recibe */
  redeemHours: 24,
  /** el cupón se usa una sola vez */
  singleUse: true,
} as const;

/** Qué cuenta como una exportación: cada archivo que sale del programa. El respaldo de los proyectos no cuenta. */
export const EXPORT_KINDS = ["DXF", "PDF", "SVG", "ficha técnica", "trazo"] as const;
