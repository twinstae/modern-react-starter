import { createApiClient } from "../api-client.ts";
import { createApp, type AppDeps } from "./app.ts";
import { createMemoryEventLogStore } from "./event-log-store.ts";
import { createMemorySessionListStore } from "./session-list-store.ts";

export const TEST_NOW = "2026-10-07T12:00:00Z";
export const TEST_ID = "session-1";

/**
 * API 테스트용 클라이언트. 브라우저와 같은 createApiClient에 앱 인스턴스를 넘겨 HTTP 없이 부른다.
 * 의존성은 메모리 구현과 고정된 시각·id가 기본이고, 필요한 것만 바꿔 끼운다.
 */
export function createTestClient(deps: Partial<AppDeps> = {}) {
  const app = createApp({
    sessionListStore: createMemorySessionListStore(),
    eventLogStore: createMemoryEventLogStore(),
    now: () => TEST_NOW,
    generateId: () => TEST_ID,
    ...deps,
  });
  return createApiClient(app);
}
