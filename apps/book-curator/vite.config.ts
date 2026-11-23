import { defineConfig, lazyPlugins } from "vite-plus";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { pandacss } from "@pandacss/vite";
import { playwright } from "vite-plus/test/browser-playwright";

import { fakeAliases } from "./fake-aliases.ts";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  // 서버 없는 정적 SPA다(ADR 0006). `vp build`는 dist/에 index.html과 자산만 낸다.
  plugins: lazyPlugins(() => [
    pandacss(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    viteReact(),
  ]),
  test: {
    // node 프로젝트와 브라우저 프로젝트가 동시에 뜨면 브라우저 iframe이 초기화되지 않을 때가
    // 있다. 한 워커로 순서대로 돌려 결과를 안정시킨다.
    maxWorkers: 1,
    projects: [
      {
        extends: true,
        test: {
          // 순수 코어, 유스케이스, 저장소 계약 테스트. IndexedDB는 fake-indexeddb로 돈다.
          name: "domain",
          environment: "node",
          include: [
            "src/domain/**/*.test.ts",
            "src/application/**/*.test.ts",
            "src/persistence/**/*.test.ts",
          ],
        },
      },
      {
        extends: true,
        resolve: { alias: fakeAliases },
        test: {
          // 스토리 args로 렌더링한다. 저장소와 기기 상태를 모른다.
          name: "component",
          setupFiles: ["src/setupTest.ts"],
          include: ["src/components/**/*.test.tsx", "src/lib/**/*.test.ts"],
          // 브라우저 모드는 파일을 여럿 동시에 불러오면 모듈 몇 개를 받지 못해 "Failed to import test file"로 죽는다.
          // 한 파일씩 돌린다. 몇 초 느려지지만 결과가 흔들리지 않는다.
          fileParallelism: false,
          browser: {
            enabled: true,
            headless: true,
            connectTimeout: 120_000,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
