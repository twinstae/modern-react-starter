import { Elysia } from "elysia";

import { checkHealth } from "../application/check-health.ts";
import { HealthSchema } from "../domain/health.ts";

export interface AppDeps {
  /** 현재 시각 ISO 문자열. 테스트는 고정 시각을 넣는다. */
  now: () => string;
}

/**
 * 서버 앱. 저장소·시각 같은 의존성은 인자로 받아, 테스트가 메모리 구현과 고정 시각을 주입할 수 있게 한다.
 */
export function createApp({ now }: AppDeps) {
  return new Elysia({ prefix: "/api" }).get("/health", () => checkHealth({ now }), {
    response: HealthSchema,
  });
}

export type App = ReturnType<typeof createApp>;
