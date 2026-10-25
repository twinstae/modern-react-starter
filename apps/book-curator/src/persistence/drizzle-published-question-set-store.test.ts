import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

import { SEED_QUESTION_SET } from "../domain/seed-question-set.ts";
import { openDatabase, type Database } from "./database.ts";
import { createDrizzlePublishedQuestionSetStore } from "./drizzle-published-question-set-store.ts";
import { publishedQuestionSetStoreContract } from "./published-question-set-store.contract.ts";
import { publishedQuestionSets, publishedQuestionSetPointer } from "./schema.ts";

let db: Database;

beforeAll(async () => {
  db = await openDatabase();
});

afterAll(async () => {
  await db.$client.close();
});

publishedQuestionSetStoreContract("PGlite", async () => {
  await db.delete(publishedQuestionSetPointer);
  await db.delete(publishedQuestionSets);
  return createDrizzlePublishedQuestionSetStore(db);
});

describe("PGlite 파일 DB의 공개 버전", () => {
  it("DB를 다시 열어도 현재 버전과 이전 버전 행이 남는다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "book-curator-published-"));
    const dataDir = join(dir, ".data", "pglite");

    try {
      const first = await openDatabase(dataDir);
      const store = createDrizzlePublishedQuestionSetStore(first);
      await store.publish(SEED_QUESTION_SET);
      await first.$client.close();

      const second = await openDatabase(dataDir);
      const reopened = createDrizzlePublishedQuestionSetStore(second);
      expect(await reopened.current()).toStrictEqual({
        version: 1,
        questionSet: SEED_QUESTION_SET,
      });
      expect(await reopened.get(1)).toStrictEqual({ version: 1, questionSet: SEED_QUESTION_SET });
      await second.$client.close();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
