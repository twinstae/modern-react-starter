import { defineConfig, lazyPlugins } from "vite-plus";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { pandacss } from "@pandacss/vite";
import { playwright } from "vite-plus/test/browser-playwright";

import { fakeAliases } from "./fake-aliases.ts";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: lazyPlugins(() => [
    // 테스트에는 서버 번들러가 필요 없다. vitest 안에서 nitro는 TanStack Start의 서버 진입점을
    // 미리 불러오다가 CommonJS인 react를 ESM으로 평가해 "module is not defined"를 낸다.
    process.env.VITEST ? [] : nitro(),
    pandacss(),
    tanstackStart({ spa: { enabled: true } }),
    viteReact(),
  ]),
  test: {
    projects: [
      {
        extends: true,
        test: {
          // 순수 코어, 유스케이스, 저장소 계약 테스트
          name: "domain",
          environment: "node",
          // PGlite를 띄우고 마이그레이션하는 데 몇 초가 걸린다. beforeAll도 여유를 둔다.
          testTimeout: 15_000,
          hookTimeout: 30_000,
          include: [
            "src/domain/**/*.test.ts",
            "src/application/**/*.test.ts",
            "src/persistence/**/*.test.ts",
          ],
        },
      },
      {
        extends: true,
        test: {
          // elysia 앱을 메모리 의존성으로 HTTP 요청 테스트한다. 인증 테스트만 PGlite를 쓴다.
          name: "api",
          environment: "node",
          hookTimeout: 30_000,
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
          // 브라우저 모드는 파일을 여럿 동시에 불러오면 모듈 몇 개를 받지 못해 "Failed to import test file"로 죽는다.
          // 한 파일씩 돌린다. 몇 초 느려지지만 결과가 흔들리지 않는다.
          fileParallelism: false,
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
