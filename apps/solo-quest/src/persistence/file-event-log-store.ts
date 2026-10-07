import { appendFile, mkdir, readFile, truncate } from "node:fs/promises";
import { join } from "node:path";

import type { SessionEvent } from "../domain/session.ts";
import {
  lastVersionOf,
  VersionConflictError,
  type EventLogStore,
} from "../domain/event-log-store.ts";

/**
 * 세션마다 `<dir>/<sessionId>.jsonl` 파일에 한 줄에 이벤트 하나를 추가한다.
 * 서버 프로세스가 하나라고 가정하고, 세션마다 메모리 잠금으로 버전 확인과 쓰기를 한 덩어리로 묶는다.
 * 한 번의 추가는 write 한 번으로 쓴다. fsync는 하지 않는다.
 *
 * 쓰다 죽으면 마지막 줄이 줄바꿈 없이 끊길 수 있다. 읽을 때 그 줄은 경고하고 무시하며, 다음 추가 때 잘라 낸다.
 */
export function createFileEventLogStore(
  dir: string,
  { warn = console.warn }: { warn?: (message: string) => void } = {},
): EventLogStore {
  const pathOf = (sessionId: string) => join(dir, `${sessionId}.jsonl`);
  const locks = new Map<string, Promise<unknown>>();

  /** 같은 세션의 작업을 줄 세운다. 앞 작업이 실패해도 다음 작업은 돈다. */
  const withLock = <T>(sessionId: string, task: () => Promise<T>): Promise<T> => {
    const result = (locks.get(sessionId) ?? Promise.resolve()).then(task, task);
    locks.set(sessionId, result);
    return result;
  };

  /** 이벤트 목록과, 끊긴 마지막 줄을 뺀 온전한 부분의 바이트 수, 끊긴 줄이 있었는지 */
  const load = async (sessionId: string) => {
    let text: string;
    try {
      text = await readFile(pathOf(sessionId), "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT")
        return { events: [], intactBytes: 0, broken: false };
      throw error;
    }
    // 마지막 줄바꿈 뒤의 조각은 쓰다 만 것이다
    const lines = text.split("\n");
    let broken = lines.pop() !== "";
    const parse = (line: string) => JSON.parse(line) as SessionEvent;
    // 줄바꿈으로 끝났어도 마지막 줄이 JSON이 아니면 깨진 줄이다. 그 앞 줄이 깨졌다면 손상이라 오류로 둔다.
    if (lines.length > 0) {
      try {
        parse(lines.at(-1) ?? "");
      } catch {
        lines.pop();
        broken = true;
      }
    }
    if (broken) warn(`${sessionId}: 마지막 줄이 깨져 있어 무시합니다`);
    const events = lines.filter((line) => line !== "").map(parse);
    const intact = lines.map((line) => `${line}\n`).join("");
    return { events, intactBytes: Buffer.byteLength(intact), broken };
  };

  return {
    read: async (sessionId) => (await load(sessionId)).events,
    append: (sessionId, expectedVersion, events) =>
      withLock(sessionId, async () => {
        const { events: stored, intactBytes, broken } = await load(sessionId);
        const actualVersion = lastVersionOf(stored);
        if (actualVersion !== expectedVersion) {
          throw new VersionConflictError(expectedVersion, actualVersion);
        }
        await mkdir(dir, { recursive: true });
        if (broken) await truncate(pathOf(sessionId), intactBytes);
        await appendFile(pathOf(sessionId), events.map((e) => `${JSON.stringify(e)}\n`).join(""));
      }),
  };
}
