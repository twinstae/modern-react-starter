import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

import { createApiClient } from "../api-client.ts";
import { setOwnerPin, unlockOwner, verifyOwnerToken } from "../application/owner-access.ts";
import { sampleFunnelEvents } from "../domain/funnel.fixture.ts";
import { SEED_QUESTION_SET } from "../domain/seed-question-set.ts";
import { SHELF_BOOKS } from "../domain/shelf.fixture.ts";
import { createAuth } from "../server/auth.ts";
import { createTestServer, signInOperator, TEST_OPERATOR } from "../server/test-client.ts";
import { openDatabase, type LocalDatabase } from "./database.ts";
import { createDrizzleBookStore } from "./drizzle-book-store.ts";
import { createDrizzleDrawerStockStore } from "./drizzle-drawer-stock-store.ts";
import { createDrizzleEventStore } from "./drizzle-event-store.ts";
import { createDrizzleOwnerAccessStore } from "./drizzle-owner-access-store.ts";
import {
  createDrizzleHandoverStore,
  createDrizzlePurchaseStore,
} from "./drizzle-owner-record-store.ts";
import { createDrizzlePublishedQuestionSetStore } from "./drizzle-published-question-set-store.ts";
import { createDrizzleQuestionSetDraftStore } from "./drizzle-question-set-draft-store.ts";
import { eventStoreContract } from "./event-store.contract.ts";
import { ownerAccessStoreContract } from "./owner-access-store.contract.ts";
import { ownerRecordStoreContract } from "./owner-record-store.contract.ts";
import { publishedQuestionSetStoreContract } from "./published-question-set-store.contract.ts";
import { questionSetDraftStoreContract } from "./question-set-draft-store.contract.ts";
import {
  books,
  drawerStock,
  funnelEvents,
  handovers,
  ownerAccess,
  ownerTokens,
  publishedQuestionSetPointer,
  publishedQuestionSets,
  purchases,
  questionSetDrafts,
} from "./schema.ts";
import { shelfStoreContract } from "./shelf-store.contract.ts";

// PGlite를 열고 마이그레이션하는 데 몇 초가 걸린다. 모든 계약이 DB 하나를 나눠 쓰고,
// 각 계약은 자기 표만 비운다.
let db: LocalDatabase;

beforeAll(async () => {
  db = await openDatabase();
});

afterAll(async () => {
  await db.$client.close();
});

shelfStoreContract("PGlite", async () => {
  await db.delete(drawerStock);
  await db.delete(books);
  return {
    books: createDrizzleBookStore(db),
    stock: createDrizzleDrawerStockStore(db),
  };
});

eventStoreContract("PGlite", async () => {
  await db.delete(funnelEvents);
  return createDrizzleEventStore(db);
});

publishedQuestionSetStoreContract("PGlite", async () => {
  await db.delete(publishedQuestionSetPointer);
  await db.delete(publishedQuestionSets);
  return createDrizzlePublishedQuestionSetStore(db);
});

questionSetDraftStoreContract("PGlite", async () => {
  await db.delete(questionSetDrafts);
  return createDrizzleQuestionSetDraftStore(db);
});

ownerRecordStoreContract("PGlite", async () => {
  await db.delete(handovers);
  await db.delete(purchases);
  return {
    handovers: createDrizzleHandoverStore(db),
    purchases: createDrizzlePurchaseStore(db),
  };
});

describe("PGlite 주인 잠금 저장소", () => {
  ownerAccessStoreContract(async () => {
    await db.delete(ownerTokens);
    await db.delete(ownerAccess);
    return createDrizzleOwnerAccessStore(db);
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
    const book = SHELF_BOOKS[0];
    if (book === undefined) throw new Error("서가 예시에 책이 없습니다");
    const events = sampleFunnelEvents("session-reopen");
    const now = "2026-10-25T00:00:00.000Z";

    try {
      const first = await openDatabase(dataDir);
      await createDrizzleBookStore(first).save(book);
      await createDrizzleDrawerStockStore(first).setQuantity("B6", book.id, 2);
      await createDrizzleEventStore(first).append(events);
      await createDrizzlePublishedQuestionSetStore(first).publish(SEED_QUESTION_SET);
      const firstAccess = createDrizzleOwnerAccessStore(first);
      await setOwnerPin(firstAccess, "4821");
      const unlocked = await unlockOwner(firstAccess, "4821", now, () => "reopen-token");
      if (unlocked.status !== "unlocked") throw new Error("토큰을 만들지 못했습니다");

      expect((await firstAccess.read())?.pinHash).not.toContain("4821");
      const tokenRows = await first.select({ tokenHash: ownerTokens.tokenHash }).from(ownerTokens);
      expect(tokenRows.map((row) => row.tokenHash)).not.toContain("reopen-token");
      await first.$client.close();

      const second = await openDatabase(dataDir);
      expect(await createDrizzleBookStore(second).list()).toStrictEqual([book]);
      expect(await createDrizzleDrawerStockStore(second).list()).toStrictEqual([
        { drawer: "B6", bookId: book.id, quantity: 2 },
      ]);
      expect(await createDrizzleEventStore(second).list("session-reopen")).toStrictEqual(events);
      const published = createDrizzlePublishedQuestionSetStore(second);
      expect(await published.current()).toStrictEqual({
        version: 1,
        questionSet: SEED_QUESTION_SET,
      });
      expect(await published.get(1)).toStrictEqual({ version: 1, questionSet: SEED_QUESTION_SET });
      expect(
        await verifyOwnerToken(createDrizzleOwnerAccessStore(second), "reopen-token", now),
      ).toBe(true);
      await second.$client.close();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
