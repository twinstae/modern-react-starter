import { afterAll, beforeAll } from "vite-plus/test";

import { openDatabase, type Database } from "./database.ts";
import { createDrizzleQuestionSetDraftStore } from "./drizzle-question-set-draft-store.ts";
import { questionSetDraftStoreContract } from "./question-set-draft-store.contract.ts";
import { questionSetDrafts } from "./schema.ts";

let db: Database;

beforeAll(async () => {
  db = await openDatabase();
});

afterAll(async () => {
  await db.$client.close();
});

questionSetDraftStoreContract("PGlite", async () => {
  await db.delete(questionSetDrafts);
  return createDrizzleQuestionSetDraftStore(db);
});
