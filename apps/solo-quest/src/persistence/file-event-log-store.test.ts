import { appendFile, mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";

import { postedEvent, startedEvent } from "../domain/session.fixture.ts";
import { createFileEventLogStore } from "./file-event-log-store.ts";

const started = startedEvent("s-1");
const posted = postedEvent("s-1", 2, "안으로 들어간다", "player");

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

  it("중간 줄이 깨졌으면 데이터 손상이므로 읽을 때 오류가 난다", async () => {
    const dir = await makeDir();
    const store = createFileEventLogStore(dir);
    await appendFile(
      join(dir, "s-1.jsonl"),
      `${JSON.stringify(started)}\n{"eventId":"event-2","eventNa\n${JSON.stringify(posted)}\n`,
    );

    await expect(store.read("s-1")).rejects.toThrow();
  });

  it("줄바꿈으로 끝나더라도 마지막 줄이 JSON이 아니면 깨진 줄로 보고 무시하며, 이어서 추가할 수 있다", async () => {
    const dir = await makeDir();
    const warnings: string[] = [];
    const store = createFileEventLogStore(dir, { warn: (message) => warnings.push(message) });
    await store.append("s-1", 0, [started]);
    await appendFile(join(dir, "s-1.jsonl"), '{"eventId":"event-2","eventNa\n');

    expect(await store.read("s-1")).toStrictEqual([started]);
    expect(warnings).toHaveLength(1);

    await store.append("s-1", 1, [posted]);
    expect(await store.read("s-1")).toStrictEqual([started, posted]);
  });
});
