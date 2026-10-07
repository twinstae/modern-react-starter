import type { createApiClient } from "./api-client.ts";
import { VersionConflictError, type EventLogStore } from "./server/event-log-store.ts";
import { ApiError, unwrap } from "./unwrap.ts";

/**
 * eden 클라이언트로 서버의 이벤트 API를 부르는 이벤트 로그 저장소. 409 응답은 충돌 예외로 바꾼다.
 * 브라우저는 이것을 ventyd 어댑터로 감싸 세션 repository를 만든다.
 */
export function createHttpEventLog(client: ReturnType<typeof createApiClient>): EventLogStore {
  return {
    read: (sessionId) => unwrap(client.sessions({ id: sessionId }).events.get()),
    async append(sessionId, expectedVersion, events) {
      try {
        await unwrap(client.sessions({ id: sessionId }).events.post({ expectedVersion, events }));
      } catch (error) {
        if (error instanceof ApiError && error.status === 409) {
          throw new VersionConflictError(expectedVersion);
        }
        throw error;
      }
    },
  };
}
