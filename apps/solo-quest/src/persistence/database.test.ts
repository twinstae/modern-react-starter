import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { createDrizzleSessionListStore, openDatabase } from "./database.ts";

let dir: string | undefined;
afterEach(async () => {
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe("openDatabase", () => {
  it("아직 없는 디렉터리에도 파일 DB를 만들고, 다시 열면 내용이 남아 있다", async () => {
    dir = await mkdtemp(join(tmpdir(), "solo-quest-"));
    const dataDir = join(dir, ".data", "pglite");
    const session = { id: "s-1", title: "첫 모험", createdAt: "2026-10-07T12:00:00Z" };

    const first = await openDatabase(dataDir);
    await createDrizzleSessionListStore(first).add(session);
    await first.$client.close();

    const second = await openDatabase(dataDir);
    expect(await createDrizzleSessionListStore(second).list()).toStrictEqual([session]);
    await second.$client.close();
  });
});
