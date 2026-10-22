import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const pkg = (name: string) =>
  fileURLToPath(new URL(`./packages/${name}/src/index.ts`, import.meta.url));

// Las pruebas importan los paquetes del monorepo directo desde su código fuente.
export default defineConfig({
  resolve: {
    alias: {
      "@hilonova/geometry": pkg("geometry"),
      "@hilonova/blocks": pkg("blocks"),
      "@hilonova/export": pkg("export"),
      "@hilonova/ui": pkg("ui"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
