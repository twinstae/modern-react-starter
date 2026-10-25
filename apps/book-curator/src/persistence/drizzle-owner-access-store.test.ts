import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

import { setOwnerPin, unlockOwner, verifyOwnerToken } from "../application/owner-access.ts";
import { openDatabase, type Database } from "./database.ts";
import { createDrizzleOwnerAccessStore } from "./drizzle-owner-access-store.ts";
import { ownerAccessStoreContract } from "./owner-access-store.contract.ts";
import { ownerAccess, ownerTokens } from "./schema.ts";

const NOW = "2026-10-25T00:00:00.000Z";

let db: Database;

beforeAll(async () => {
  db = await openDatabase();
});

afterAll(async () => {
  await db.$client.close();
});

describe("PGlite 주인 잠금 저장소", () => {
  ownerAccessStoreContract(async () => {
    await db.delete(ownerTokens);
    await db.delete(ownerAccess);
    return createDrizzleOwnerAccessStore(db);
  });
});

describe("PGlite 파일 DB의 주인 잠금", () => {
  it("DB를 다시 열어도 PIN과 토큰이 남는다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "book-curator-owner-"));
    const dataDir = join(dir, ".data", "pglite");

    try {
      const first = await openDatabase(dataDir);
      const firstStore = createDrizzleOwnerAccessStore(first);
      await setOwnerPin(firstStore, "4821");
      const unlocked = await unlockOwner(firstStore, "4821", NOW, () => "reopen-token");

      const stored = await firstStore.read();
      expect(stored?.pinHash).not.toContain("4821");
      const tokenRows = await first.select({ tokenHash: ownerTokens.tokenHash }).from(ownerTokens);
      expect(tokenRows.map((row) => row.tokenHash)).not.toContain("reopen-token");

      await first.$client.close();
      if (unlocked.status !== "unlocked") throw new Error("토큰을 만들지 못했습니다");

      const second = await openDatabase(dataDir);
      const store = createDrizzleOwnerAccessStore(second);
      expect(await verifyOwnerToken(store, "reopen-token", NOW)).toBe(true);
      expect(unlocked.expiresAt).toBe("2026-10-25T00:10:00.000Z");
      await second.$client.close();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
