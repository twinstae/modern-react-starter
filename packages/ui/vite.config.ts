/// <reference types="vite-plus" />
import { defineConfig, lazyPlugins } from "vite-plus";
import viteReact from "@vitejs/plugin-react";
import { pandacss } from "@pandacss/vite";
import { playwright } from "vite-plus/test/browser-playwright";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: lazyPlugins(() => [pandacss(), viteReact()]),
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
