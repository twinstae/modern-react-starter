import { createMemoryEventLogStore, type EventLogStore } from "./event-log-store.ts";

/**
 * 메모리 저장소를 감싼 테스트용 가짜. 저장 시점과 실패, 다른 탭의 기록을 테스트가 정한다.
 * - `hold()` 뒤의 저장은 `releaseNext()`로 하나씩 풀어 주기 전까지 끝나지 않는다.
 * - `failNext(error)`는 다음 저장 하나를 그 오류로 실패시킨다.
 * - `otherTab`은 같은 저장소에 직접 쓴다. 이 컨트롤러가 모르는 사이에 다른 탭이 기록한 것과 같다.
 */
export function createFakeEventLog() {
  const memory = createMemoryEventLogStore();
  let holding = false;
  let permits = 0;
  const waiting: Array<() => void> = [];
  const failures: Error[] = [];

  const store: EventLogStore = {
    read: memory.read,
    async append(sessionId, expectedVersion, events) {
      if (holding) {
        if (permits > 0) permits -= 1;
        else await new Promise<void>((resolve) => waiting.push(resolve));
      }
      const failure = failures.shift();
      if (failure) throw failure;
      await memory.append(sessionId, expectedVersion, events);
    },
  };

  return {
    store,
    otherTab: memory,
    /** 이후 저장은 `releaseNext()`가 풀어 줄 때까지 기다린다 */
    hold() {
      holding = true;
    },
    /** 기다리는 저장 하나를 푼다. 아직 기다리는 저장이 없으면 다음 저장이 바로 지나간다. */
    releaseNext() {
      const next = waiting.shift();
      if (next) next();
      else permits += 1;
    },
    failNext(error: Error) {
      failures.push(error);
    },
  };
}
