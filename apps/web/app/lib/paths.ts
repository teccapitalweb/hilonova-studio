// Prefijo del basePath del sitio (vacío en dev, "/hilonova-studio" en Pages).
// Reutilizable desde los Link/Router helpers del shell SaaS.

export const BASE_PATH: string = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const withBase = (p: string): string => `${BASE_PATH}${p}`;
