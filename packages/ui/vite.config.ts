/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { pandacss } from "@pandacss/vite";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [pandacss(), viteReact()],
  test: {
    setupFiles: ["src/setupTest.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({}),
      instances: [{ browser: "chromium" }],
    },
  },
});
