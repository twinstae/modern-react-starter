import { appendFile, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import type { SessionEvent } from "../domain/session.ts";
import type { EventLogStore } from "../server/event-log-store.ts";

/** 세션마다 `<dir>/<sessionId>.jsonl` 파일에 한 줄에 이벤트 하나를 추가한다. */
export function createFileEventLogStore(dir: string): EventLogStore {
  const pathOf = (sessionId: string) => join(dir, `${sessionId}.jsonl`);

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
    async append(sessionId, _expectedVersion, events) {
      await mkdir(dir, { recursive: true });
      await appendFile(pathOf(sessionId), events.map((e) => `${JSON.stringify(e)}\n`).join(""));
    },
  };
}
