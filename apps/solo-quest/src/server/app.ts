import { Elysia } from "elysia";

/**
 * 서버 앱. 저장소 같은 의존성은 인자로 받아, 테스트가 메모리 구현을 주입할 수 있게 한다.
 */
export function createApp() {
  return new Elysia({ prefix: "/api" }).get("/health", () => ({ status: "ok" as const }));
}

export type App = ReturnType<typeof createApp>;
