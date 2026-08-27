import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Copia del worker de maplibre-gl: código de terceros, minificado y
    // generado por scripts/copiar-worker-maplibre.mjs.
    "public/maplibre/**",
  ]),
]);

export default eslintConfig;
