import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), wasm()],
  optimizeDeps: {
    include: ["@deck.gl/core", "@duckdb/duckdb-wasm"],
  },
  test: {
    browser: {
      enabled: true,
      provider: "playwright",
      headless: true,
      instances: [
        {
          browser: "chromium",
        },
      ],
    },
    typecheck: {
      enabled: true,
    },
  },
});
