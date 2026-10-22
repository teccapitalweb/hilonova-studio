/** @type {import('next').NextConfig} */
// Despliegue estático a GitHub Pages (proyecto `teccapitalweb/hilonova-studio`).
// En GH Pages el sitio vive bajo /hilonova-studio/, así que el build de Pages
// inyecta NEXT_PUBLIC_BASE_PATH=/hilonova-studio. En dev local la variable va
// vacía y la app sirve en la raíz como siempre.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@hilonova/ui"],
  // Static export para GitHub Pages (sin servidor Node).
  output: "export",
  // Carpetas con slash final para que GH Pages sirva /ruta/ correctamente.
  trailingSlash: true,
  // GH Pages no tiene optimizador de imágenes.
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath || undefined,
  // Expuesto al cliente para prefijar <img>/<video> en src/app/page.tsx.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
