/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { pandacss } from "@pandacss/vite";
// import path from "node:path";
// import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";

import { fakeAliases } from "./fake-aliases.ts";
// const dirname =
//   typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    devtools(),
    // 테스트에는 서버 번들러가 필요 없다. vitest 안에서 nitro는 TanStack Start의 서버 진입점을
    // 미리 불러오다가 CommonJS인 react를 ESM으로 평가해 "module is not defined"를 낸다.
    process.env.VITEST
      ? []
      : nitro({
          rollupConfig: {
            external: [/^@sentry\//],
          },
        }),
    pandacss(),
    tanstackStart({
      spa: {
        enabled: true,
      },
    }),
    viteReact(),
  ],
  test: {
    projects: [
      {
        extends: true,
        plugins: [],
        resolve: { alias: fakeAliases },
        test: {
          setupFiles: ["src/setupTest.ts"],
          name: "browser",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/domain/**", "src/application/**", "src/persistence/**", "src/api/**"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
      {
        extends: true,
        plugins: [],
        test: {
          name: "server",
          environment: "node",
          // DB 테스트는 매번 PGlite를 띄우고 마이그레이션한다 — 부하가 있으면 기본 5초를 넘는다.
          testTimeout: 15_000,
          include: [
            "src/domain/**/*.test.ts",
            "src/application/**/*.test.ts",
            "src/persistence/**/*.test.ts",
            "src/api/**/*.test.ts",
          ],
        },
      },
    ],
  },
});
export default config;
