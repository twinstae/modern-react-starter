import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

import { SHELF_BOOKS } from "../domain/shelf.fixture.ts";
import { createDrizzleBookStore } from "./drizzle-book-store.ts";
import { createDrizzleDrawerStockStore } from "./drizzle-drawer-stock-store.ts";
import { openDatabase, type Database } from "./database.ts";
import { books, drawerStock } from "./schema.ts";
import { shelfStoreContract } from "./shelf-store.contract.ts";

let db: Database;

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

describe("PGlite 파일 DB", () => {
  it("저장한 책과 서랍 속 책이 DB를 다시 열어도 남는다", async () => {
    const dir = await mkdtemp(join(tmpdir(), "book-curator-"));
    const dataDir = join(dir, ".data", "pglite");
    const book = SHELF_BOOKS[0];
    if (book === undefined) throw new Error("서가 예시에 책이 없습니다");

    try {
      const first = await openDatabase(dataDir);
      await createDrizzleBookStore(first).save(book);
      await createDrizzleDrawerStockStore(first).setQuantity("B6", book.id, 2);
      await first.$client.close();

      const second = await openDatabase(dataDir);
      expect(await createDrizzleBookStore(second).list()).toStrictEqual([book]);
      expect(await createDrizzleDrawerStockStore(second).list()).toStrictEqual([
        { drawer: "B6", bookId: book.id, quantity: 2 },
      ]);
      await second.$client.close();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
