/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { pandacss } from "@pandacss/vite";
import { playwright } from "@vitest/browser-playwright";

import { fakeAliases } from "./fake-aliases.ts";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    // 테스트에는 서버 번들러가 필요 없다. vitest 안에서 nitro는 TanStack Start의 서버 진입점을
    // 미리 불러오다가 CommonJS인 react를 ESM으로 평가해 "module is not defined"를 낸다.
    process.env.VITEST ? [] : nitro(),
    pandacss(),
    tanstackStart({ spa: { enabled: true } }),
    viteReact(),
  ],
  test: {
    projects: [
      {
        extends: true,
        test: {
          // 도메인과 순수 로직, 저장소 계약 테스트
          name: "domain",
          environment: "node",
          // PGlite를 띄우고 마이그레이션하는 데 몇 초가 걸린다. 기본 5초로는 첫 저장소 테스트가 넘친다.
          testTimeout: 15_000,
          include: ["src/domain/**/*.test.ts", "src/persistence/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          // elysia 앱을 메모리 저장소로 HTTP 요청 테스트한다. 영속성을 모른다.
          name: "api",
          environment: "node",
          include: ["src/server/**/*.test.ts"],
        },
      },
      {
        extends: true,
        resolve: { alias: fakeAliases },
        test: {
          // 스토리 args로 렌더링한다. API와 서버 상태를 모른다.
          name: "component",
          setupFiles: ["src/setupTest.ts"],
          include: ["src/components/**/*.test.tsx"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
