import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import type { SessionEvent } from "../domain/session.ts";
import {
  lastVersionOf,
  VersionConflictError,
  type EventLogStore,
} from "../server/event-log-store.ts";

/**
 * 세션마다 `<dir>/<sessionId>.jsonl` 파일에 한 줄에 이벤트 하나를 추가한다.
 * 서버 프로세스가 하나라고 가정하고, 세션마다 메모리 잠금으로 버전 확인과 쓰기를 한 덩어리로 묶는다.
 * 한 번의 추가는 write 한 번으로 쓴다. fsync는 하지 않는다.
 */
export function createFileEventLogStore(dir: string): EventLogStore {
  const pathOf = (sessionId: string) => join(dir, `${sessionId}.jsonl`);
  const locks = new Map<string, Promise<unknown>>();

  /** 같은 세션의 작업을 줄 세운다. 앞 작업이 실패해도 다음 작업은 돈다. */
  const withLock = <T>(sessionId: string, task: () => Promise<T>): Promise<T> => {
    const result = (locks.get(sessionId) ?? Promise.resolve()).then(task, task);
    locks.set(sessionId, result);
    return result;
  };

  const read = async (sessionId: string): Promise<SessionEvent[]> => {
    let text: string;
    try {
      text = await readFile(pathOf(sessionId), "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
    return text
      .split("\n")
      .filter((line) => line !== "")
      .map((line) => JSON.parse(line) as SessionEvent);
  };

  return {
    read,
    append: (sessionId, expectedVersion, events) =>
      withLock(sessionId, async () => {
        const actualVersion = lastVersionOf(await read(sessionId));
        if (actualVersion !== expectedVersion) {
          throw new VersionConflictError(expectedVersion, actualVersion);
        }
        await mkdir(dir, { recursive: true });
        await appendFile(pathOf(sessionId), events.map((e) => `${JSON.stringify(e)}\n`).join(""));
      }),
  };
}
