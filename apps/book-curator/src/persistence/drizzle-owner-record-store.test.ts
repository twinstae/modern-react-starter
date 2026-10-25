import { afterAll, beforeAll } from "vite-plus/test";

import {
  createDrizzleHandoverStore,
  createDrizzlePurchaseStore,
} from "./drizzle-owner-record-store.ts";
import { openDatabase, type Database } from "./database.ts";
import { handovers, purchases } from "./schema.ts";
import { ownerRecordStoreContract } from "./owner-record-store.contract.ts";

let db: Database;

beforeAll(async () => {
  db = await openDatabase();
});

afterAll(async () => {
  await db.$client.close();
});

ownerRecordStoreContract("PGlite", async () => {
  await db.delete(handovers);
  await db.delete(purchases);
  return {
    handovers: createDrizzleHandoverStore(db),
    purchases: createDrizzlePurchaseStore(db),
  };
});
