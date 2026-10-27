import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

import { createApiClient } from "../api-client.ts";
import { setOwnerPin, unlockOwner, verifyOwnerToken } from "../application/owner-access.ts";
import { sampleFunnelEvents } from "../domain/funnel.fixture.ts";
import { snapshotOf } from "../domain/kiosk.ts";
import { SEED_DRAWERS } from "../domain/seed-question-set.ts";
import { createAuth } from "../server/auth.ts";
import { createTestServer, signInOperator, TEST_OPERATOR } from "../server/test-client.ts";
import { openDatabase, type LocalDatabase } from "./database.ts";
import { drawerStoreContract } from "./drawer-store.contract.ts";
import { createDrizzleDrawerStore } from "./drizzle-drawer-store.ts";
import { createDrizzleEventStore } from "./drizzle-event-store.ts";
import { createDrizzleOwnerAccessStore } from "./drizzle-owner-access-store.ts";
import { createDrizzleHandoverStore } from "./drizzle-owner-record-store.ts";
import { createDrizzlePublishedVersionStore } from "./drizzle-published-version-store.ts";
import { eventStoreContract } from "./event-store.contract.ts";
import { ownerAccessStoreContract } from "./owner-access-store.contract.ts";
import { ownerRecordStoreContract } from "./owner-record-store.contract.ts";
import { publishedVersionStoreContract } from "./published-version-store.contract.ts";
import {
  drawers,
  funnelEvents,
  handovers,
  ownerAccess,
  ownerTokens,
  publishedQuestionSets,
  publishedVersions,
} from "./schema.ts";

// PGlite를 열고 마이그레이션하는 데 몇 초가 걸린다. 모든 계약이 DB 하나를 나눠 쓰고,
// 각 계약은 자기 표만 비운다.
let db: LocalDatabase;

beforeAll(async () => {
  db = await openDatabase();
});

afterAll(async () => {
  await db.$client.close();
});

drawerStoreContract("PGlite", async () => {
  await db.delete(drawers);
  return createDrizzleDrawerStore(db);
});

eventStoreContract("PGlite", async () => {
  await db.delete(funnelEvents);
  return createDrizzleEventStore(db);
});

publishedVersionStoreContract("PGlite", async () => {
  await db.delete(publishedVersions);
  await db.delete(publishedQuestionSets);
  return createDrizzlePublishedVersionStore(db);
});

ownerRecordStoreContract("PGlite", async () => {
  await db.delete(handovers);
  return { handovers: createDrizzleHandoverStore(db) };
});

describe("PGlite 주인 잠금 저장소", () => {
  ownerAccessStoreContract(async () => {
    await db.delete(ownerTokens);
    await db.delete(ownerAccess);
    return createDrizzleOwnerAccessStore(db);
  });
});

describe("PGlite 공개 버전 번호", () => {
  it("예전 모델로 공개한 버전 번호 뒤를 이어, 이벤트의 버전이 겹치지 않는다(I-16)", async () => {
    await db.delete(publishedVersions);
    await db.delete(publishedQuestionSets);
    await db.insert(publishedQuestionSets).values({ version: 4, questionSet: {} });

    const published = await createDrizzlePublishedVersionStore(db).publish(
      snapshotOf(SEED_DRAWERS),
    );

    expect(published.version).toBe(5);
  });
});

describe("PGlite 위의 운영자 인증", () => {
  it("drizzle 어댑터로 가입한 운영자가 로그인해 운영 API를 부른다", async () => {
    const auth = createAuth(drizzleAdapter(db, { provider: "pg" }));
    const { app } = createTestServer({ auth });

    const cookie = await signInOperator(auth);
    const client = createApiClient(app, { headers: { cookie } });
    const response = await client.admin.me.get();

    expect(response.status).toBe(200);
    expect(response.data?.user.email).toBe(TEST_OPERATOR.email);
  });
});

describe("PGlite 파일 DB", () => {
  it("DB를 다시 열어도 모든 저장소의 행이 남는다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "book-curator-"));
    const dataDir = join(dir, ".data", "pglite");
    const events = sampleFunnelEvents("session-reopen");
    const now = "2026-10-25T00:00:00.000Z";
    const snapshot = snapshotOf(SEED_DRAWERS);

    try {
      const first = await openDatabase(dataDir);
      const firstDrawers = createDrizzleDrawerStore(first);
      await firstDrawers.create({ id: "a", name: "가 서랍" });
      await firstDrawers.addBooks("a", [
        { id: "1", title: "첫 책", author: "저자", publisher: "" },
      ]);
      await createDrizzleEventStore(first).append(events);
      await createDrizzlePublishedVersionStore(first).publish(snapshot);
      const firstAccess = createDrizzleOwnerAccessStore(first);
      await setOwnerPin(firstAccess, "4821");
      const unlocked = await unlockOwner(firstAccess, "4821", now, () => "reopen-token");
      if (unlocked.status !== "unlocked") throw new Error("토큰을 만들지 못했습니다");

      expect((await firstAccess.read())?.pinHash).not.toContain("4821");
      const tokenRows = await first.select({ tokenHash: ownerTokens.tokenHash }).from(ownerTokens);
      expect(tokenRows.map((row) => row.tokenHash)).not.toContain("reopen-token");
      await first.$client.close();

      const second = await openDatabase(dataDir);
      expect(await createDrizzleDrawerStore(second).list()).toStrictEqual([
        {
          id: "a",
          name: "가 서랍",
          questions: [],
          books: [{ id: "1", title: "첫 책", author: "저자", publisher: "" }],
        },
      ]);
      expect(await createDrizzleEventStore(second).list("session-reopen")).toStrictEqual(events);
      expect(await createDrizzlePublishedVersionStore(second).current()).toStrictEqual({
        version: 1,
        ...snapshot,
      });
      expect(
        await verifyOwnerToken(createDrizzleOwnerAccessStore(second), "reopen-token", now),
      ).toBe(true);
      await second.$client.close();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
