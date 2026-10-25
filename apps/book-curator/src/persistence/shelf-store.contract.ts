import { beforeEach, describe, expect, it } from "vite-plus/test";

import type { BookStore, DrawerStockStore } from "../application/shelf-ports.ts";
import type { Book } from "../domain/book.ts";
import { SHELF_BOOKS } from "../domain/shelf.fixture.ts";

export interface ShelfStores {
  readonly books: BookStore;
  readonly stock: DrawerStockStore;
}

export type ShelfStoreSetup = () => Promise<ShelfStores>;

const fixtureBook = (id: string): Book => {
  const book = SHELF_BOOKS.find((entry) => entry.id === id);
  if (book === undefined) throw new Error(`서가 예시에 없는 책입니다: ${id}`);
  return book;
};

/**
 * 메모리와 PGlite 구현이 함께 통과하는 서가 저장소 계약.
 * 각 테스트는 `setup`으로 빈 저장소를 새로 받는다.
 */
export function shelfStoreContract(name: string, setup: ShelfStoreSetup): void {
  describe(`${name} 서가 저장소 계약`, () => {
    let stores: ShelfStores;

    beforeEach(async () => {
      stores = await setup();
    });

    it("책을 저장하고 id 순서로 나열하며 단건으로 읽는다", async () => {
      const later = fixtureBook("book-b6-2");
      const earlier = fixtureBook("book-b6-1");

      await stores.books.save(later);
      await stores.books.save(earlier);

      expect(await stores.books.list()).toStrictEqual([earlier, later]);
      expect(await stores.books.get("book-b6-1")).toStrictEqual(earlier);
      expect(await stores.books.get("book-none")).toBeNull();
    });

    it("같은 id의 책을 다시 저장하면 새 값으로 덮어쓴다", async () => {
      const book = fixtureBook("book-b6-1");
      const changed: Book = { ...book, title: "고친 제목", keywords: ["고침"] };

      await stores.books.save(book);
      await stores.books.save(changed);

      expect(await stores.books.list()).toStrictEqual([changed]);
      expect(await stores.books.get(book.id)).toStrictEqual(changed);
    });

    it("서랍 속 책 수량을 넣고 고치고 지우며, 0권도 줄을 남긴다", async () => {
      const book = fixtureBook("book-b6-1");
      await stores.books.save(book);

      await stores.stock.setQuantity("B6", book.id, 2);
      await stores.stock.setQuantity("B1", book.id, 1);
      await stores.stock.setQuantity("B6", book.id, 5);

      expect(await stores.stock.list()).toStrictEqual([
        { drawer: "B1", bookId: book.id, quantity: 1 },
        { drawer: "B6", bookId: book.id, quantity: 5 },
      ]);

      await stores.stock.setQuantity("B6", book.id, 0);
      expect(await stores.stock.list()).toContainEqual({
        drawer: "B6",
        bookId: book.id,
        quantity: 0,
      });

      await stores.stock.remove("B6", book.id);
      expect(await stores.stock.list()).toStrictEqual([
        { drawer: "B1", bookId: book.id, quantity: 1 },
      ]);
    });

    it("수량이 0 이상의 정수가 아니면 저장하지 않는다", async () => {
      const book = fixtureBook("book-b6-1");

      await expect(stores.stock.setQuantity("B6", book.id, -1)).rejects.toThrow();
      await expect(stores.stock.setQuantity("B6", book.id, 1.5)).rejects.toThrow();
      expect(await stores.stock.list()).toStrictEqual([]);
    });
  });
}
