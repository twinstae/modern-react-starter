import { createApiClient } from "../api-client.ts";
import { createMemoryEventStore } from "../persistence/memory-event-store.ts";
import { createMemoryPublishedQuestionSetStore } from "../persistence/memory-published-question-set-store.ts";
import { createApp, type AppDeps } from "./app.ts";

export const TEST_NOW = "2026-10-25T00:00:00.000Z";

/**
 * API 테스트용 클라이언트. 브라우저와 같은 createApiClient에 앱 인스턴스를 넘겨 HTTP 없이 부른다.
 * 의존성은 메모리 구현과 고정 시각이 기본이고, 필요한 것만 바꿔 끼운다.
 */
export function createTestClient(deps: Partial<AppDeps> = {}) {
  const app = createApp({
    now: () => TEST_NOW,
    publishedQuestionSetStore: createMemoryPublishedQuestionSetStore(),
    eventStore: createMemoryEventStore(),
    ...deps,
  });
  return createApiClient(app);
}
