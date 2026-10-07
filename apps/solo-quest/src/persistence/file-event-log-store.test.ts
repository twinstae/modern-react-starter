import { appendFile, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { DEFAULT_CHARACTERS, type SessionEvent } from "../domain/session.ts";
import { createFileEventLogStore } from "./file-event-log-store.ts";

const started: SessionEvent = {
  eventId: "event-1",
  eventName: "session:started",
  eventCreatedAt: "2026-10-07T12:00:00Z",
  entityName: "session",
  entityId: "s-1",
  version: 1,
  body: { characters: DEFAULT_CHARACTERS },
};

const posted: SessionEvent = {
  eventId: "event-2",
  eventName: "session:message_posted",
  eventCreatedAt: "2026-10-07T12:00:01Z",
  entityName: "session",
  entityId: "s-1",
  version: 2,
  body: { side: "player", as: "player", content: "안으로 들어간다" },
};

const makeDir = () => mkdtemp(join(tmpdir(), "solo-quest-file-log-"));

describe("파일 이벤트 로그 저장소", () => {
  it("세션마다 한 줄에 이벤트 하나씩 JSONL 파일에 쌓이고, 저장소를 다시 만들어도 읽힌다", async () => {
    const dir = await makeDir();
    const store = createFileEventLogStore(dir);
    await store.append("s-1", 0, [started]);
    await store.append("s-1", 1, [posted]);

    const lines = (await readFile(join(dir, "s-1.jsonl"), "utf8")).trimEnd().split("\n");
    expect(lines.map((line) => JSON.parse(line))).toStrictEqual([started, posted]);
    expect(await createFileEventLogStore(dir).read("s-1")).toStrictEqual([started, posted]);
  });

  it("쓰다 죽어 마지막 줄이 깨져도 경고하고 앞 이벤트를 읽으며, 이어서 추가할 수 있다", async () => {
    const dir = await makeDir();
    const warnings: string[] = [];
    const store = createFileEventLogStore(dir, { warn: (message) => warnings.push(message) });
    await store.append("s-1", 0, [started]);
    await appendFile(join(dir, "s-1.jsonl"), '{"eventId":"event-2","eventNa');

    expect(await store.read("s-1")).toStrictEqual([started]);
    expect(warnings).toHaveLength(1);

    await store.append("s-1", 1, [posted]);
    expect(await store.read("s-1")).toStrictEqual([started, posted]);
  });
});
