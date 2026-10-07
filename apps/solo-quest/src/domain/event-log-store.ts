import type { SessionEvent } from "../domain/session.ts";

/** 이벤트 로그 저장소. 세션 하나의 이벤트를 추가만 하고 전체를 읽는다. */
export interface EventLogStore {
  /** 버전순으로 전체를 읽는다. 기록이 없으면 빈 배열이다. */
  read(sessionId: string): Promise<SessionEvent[]>;
  /** 저장된 마지막 버전이 expectedVersion이 아니면 VersionConflictError를 던진다. */
  append(sessionId: string, expectedVersion: number, events: SessionEvent[]): Promise<void>;
}

/** 저장된 마지막 버전이 호출한 쪽이 알던 버전과 다르다 */
export class VersionConflictError extends Error {
  constructor(
    readonly expectedVersion: number,
    /** 서버가 알려 주지 않으면 알 수 없다 */
    readonly actualVersion?: number,
  ) {
    super(`버전 충돌: 기대 ${expectedVersion}, 실제 ${actualVersion ?? "알 수 없음"}`);
    this.name = "VersionConflictError";
  }
}

/** 로그의 마지막 버전. 비어 있으면 0이다. */
export const lastVersionOf = (events: SessionEvent[]) => events.at(-1)?.version ?? 0;

export function createMemoryEventLogStore(): EventLogStore {
  const logs = new Map<string, SessionEvent[]>();

  return {
    async read(sessionId) {
      return logs.get(sessionId) ?? [];
    },
    async append(sessionId, expectedVersion, events) {
      const log = logs.get(sessionId) ?? [];
      const actualVersion = lastVersionOf(log);
      if (actualVersion !== expectedVersion) {
        throw new VersionConflictError(expectedVersion, actualVersion);
      }
      logs.set(sessionId, [...log, ...events]);
    },
  };
}
