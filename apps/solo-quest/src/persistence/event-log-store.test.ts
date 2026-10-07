import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { DEFAULT_CHARACTERS, type SessionEvent } from "../domain/session.ts";
import { createMemoryEventLogStore, type EventLogStore } from "../server/event-log-store.ts";
import { createFileEventLogStore } from "./file-event-log-store.ts";

const started = (sessionId: string): SessionEvent => ({
  eventId: `${sessionId}-event-1`,
  eventName: "session:started",
  eventCreatedAt: "2026-10-07T12:00:00Z",
  entityName: "session",
  entityId: sessionId,
  version: 1,
  body: { characters: DEFAULT_CHARACTERS },
});

const posted = (sessionId: string, version: number, content: string): SessionEvent => ({
  eventId: `${sessionId}-event-${version}`,
  eventName: "session:message_posted",
  eventCreatedAt: "2026-10-07T12:00:00Z",
  entityName: "session",
  entityId: sessionId,
  version,
  body: { side: "master", as: "gm", content },
});

function describeEventLogStore(name: string, makeStore: () => Promise<EventLogStore>) {
  describe(`이벤트 로그 저장소 (${name})`, () => {
    it("아직 기록이 없는 세션은 빈 로그다", async () => {
      const store = await makeStore();

      expect(await store.read("s-1")).toStrictEqual([]);
    });

    it("추가한 이벤트를 버전순으로 다시 읽는다", async () => {
      const store = await makeStore();
      const events = [started("s-1"), posted("s-1", 2, "문이 열린다\n안은 어둡다")];

      await store.append("s-1", 0, [events[0]]);
      await store.append("s-1", 1, [events[1]]);

      expect(await store.read("s-1")).toStrictEqual(events);
    });
  });
}

describeEventLogStore("메모리", async () => createMemoryEventLogStore());
describeEventLogStore("JSONL 파일", async () =>
  createFileEventLogStore(await mkdtemp(join(tmpdir(), "solo-quest-event-log-"))),
);
