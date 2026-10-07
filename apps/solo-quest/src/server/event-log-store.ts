import type { SessionEvent } from "../domain/session.ts";

/** 이벤트 로그 저장소. 세션 하나의 이벤트를 추가만 하고 전체를 읽는다. */
export interface EventLogStore {
  /** 버전순으로 전체를 읽는다. 기록이 없으면 빈 배열이다. */
  read(sessionId: string): Promise<SessionEvent[]>;
  /** 저장된 마지막 버전이 expectedVersion이 아니면 VersionConflictError를 던진다. */
  append(sessionId: string, expectedVersion: number, events: SessionEvent[]): Promise<void>;
}

export function createMemoryEventLogStore(): EventLogStore {
  const logs = new Map<string, SessionEvent[]>();

  return {
    async read(sessionId) {
      return logs.get(sessionId) ?? [];
    },
    async append(sessionId, _expectedVersion, events) {
      logs.set(sessionId, [...(logs.get(sessionId) ?? []), ...events]);
    },
  };
}
