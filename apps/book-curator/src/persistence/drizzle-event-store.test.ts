import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

import { sampleFunnelEvents } from "../domain/funnel.fixture.ts";
import { openDatabase, type Database } from "./database.ts";
import { createDrizzleEventStore } from "./drizzle-event-store.ts";
import { eventStoreContract } from "./event-store.contract.ts";
import { funnelEvents } from "./schema.ts";

let db: Database;

beforeAll(async () => {
  db = await openDatabase();
});

afterAll(async () => {
  await db.$client.close();
});

eventStoreContract("PGlite", async () => {
  await db.delete(funnelEvents);
  return createDrizzleEventStore(db);
});

describe("PGlite 파일 DB의 이벤트", () => {
  it("DB를 다시 열어도 이벤트가 순서대로 남는다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "book-curator-events-"));
    const dataDir = join(dir, ".data", "pglite");
    const events = sampleFunnelEvents("session-reopen");

    try {
      const first = await openDatabase(dataDir);
      await createDrizzleEventStore(first).append(events);
      await first.$client.close();

      const second = await openDatabase(dataDir);
      expect(await createDrizzleEventStore(second).list("session-reopen")).toStrictEqual(events);
      await second.$client.close();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
