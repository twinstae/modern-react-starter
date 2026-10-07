import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { postedEvent, startedEvent } from "../domain/session.fixture.ts";
import {
  createMemoryEventLogStore,
  VersionConflictError,
  type EventLogStore,
} from "../server/event-log-store.ts";
import { createFileEventLogStore } from "./file-event-log-store.ts";

function describeEventLogStore(name: string, makeStore: () => Promise<EventLogStore>) {
  describe(`이벤트 로그 저장소 (${name})`, () => {
    it("아직 기록이 없는 세션은 빈 로그다", async () => {
      const store = await makeStore();

      expect(await store.read("s-1")).toStrictEqual([]);
    });

    it("추가한 이벤트를 버전순으로 다시 읽는다", async () => {
      const store = await makeStore();
      const events = [startedEvent("s-1"), postedEvent("s-1", 2, "문이 열린다\n안은 어둡다")];

      await store.append("s-1", 0, [events[0]]);
      await store.append("s-1", 1, [events[1]]);

      expect(await store.read("s-1")).toStrictEqual(events);
    });

    it("저장된 마지막 버전과 expectedVersion이 다르면 충돌 오류이고 아무것도 쓰지 않는다", async () => {
      const store = await makeStore();
      await store.append("s-1", 0, [startedEvent("s-1")]);

      await expect(store.append("s-1", 0, [postedEvent("s-1", 1, "중복")])).rejects.toThrow(
        VersionConflictError,
      );
      await expect(store.append("s-1", 5, [postedEvent("s-1", 6, "건너뜀")])).rejects.toThrow(
        VersionConflictError,
      );
      expect(await store.read("s-1")).toStrictEqual([startedEvent("s-1")]);
    });

    it("다른 세션의 이벤트와 섞이지 않는다", async () => {
      const store = await makeStore();

      await store.append("s-1", 0, [startedEvent("s-1")]);
      await store.append("s-2", 0, [startedEvent("s-2")]);
      await store.append("s-2", 1, [postedEvent("s-2", 2, "둘째 세션")]);

      expect(await store.read("s-1")).toStrictEqual([startedEvent("s-1")]);
      expect(await store.read("s-2")).toStrictEqual([
        startedEvent("s-2"),
        postedEvent("s-2", 2, "둘째 세션"),
      ]);
    });

    it("같은 세션에 동시에 추가하면 하나만 성공하고 이벤트가 섞이지 않는다", async () => {
      const store = await makeStore();
      await store.append("s-1", 0, [startedEvent("s-1")]);
      const contents = Array.from({ length: 20 }, (_, i) => `동시 ${i}`);

      const results = await Promise.allSettled(
        contents.map((content) =>
          store.append("s-1", 1, [postedEvent("s-1", 2, content), postedEvent("s-1", 3, content)]),
        ),
      );

      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
      const log = await store.read("s-1");
      expect(log.map((event) => event.version)).toStrictEqual([1, 2, 3]);
      expect(log[1]?.body).toStrictEqual(log[2]?.body);
    });
  });
}

describeEventLogStore("메모리", async () => createMemoryEventLogStore());
describeEventLogStore("JSONL 파일", async () =>
  createFileEventLogStore(await mkdtemp(join(tmpdir(), "solo-quest-event-log-"))),
);
