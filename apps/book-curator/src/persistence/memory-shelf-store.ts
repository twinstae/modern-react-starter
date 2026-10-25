import type { BookStore, DrawerStockStore } from "../application/shelf-ports.ts";
import type { Book } from "../domain/book.ts";
import { parseDrawerStockEntry, type DrawerStockEntry } from "../domain/shelf.ts";

const byId = (a: Book, b: Book): number => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

const stockKey = (drawer: string, bookId: string): string => `${drawer}:${bookId}`;

const byDrawerThenBook = (a: DrawerStockEntry, b: DrawerStockEntry): number =>
  a.drawer < b.drawer
    ? -1
    : a.drawer > b.drawer
      ? 1
      : a.bookId < b.bookId
        ? -1
        : a.bookId > b.bookId
          ? 1
          : 0;

/** 책을 프로세스 메모리에 둔다. 앱 테스트와 계약 테스트가 쓴다. */
export function createMemoryBookStore(initial: readonly Book[] = []): BookStore {
  const books = new Map(initial.map((book) => [book.id, book]));

  return {
    async list() {
      return [...books.values()].sort(byId);
    },
    async get(id) {
      return books.get(id) ?? null;
    },
    async save(book) {
      books.set(book.id, book);
    },
  };
}

/** 서랍 속 책을 프로세스 메모리에 둔다. 목록은 서랍 코드 → 책 id 순이다. */
export function createMemoryDrawerStockStore(
  initial: readonly DrawerStockEntry[] = [],
): DrawerStockStore {
  const entries = new Map(initial.map((entry) => [stockKey(entry.drawer, entry.bookId), entry]));

  return {
    async list() {
      return [...entries.values()].sort(byDrawerThenBook);
    },
    async setQuantity(drawer, bookId, quantity) {
      const entry = parseDrawerStockEntry({ drawer, bookId, quantity });
      entries.set(stockKey(drawer, bookId), entry);
    },
    async decrease(drawer, bookId, by) {
      if (!Number.isInteger(by) || by < 1) {
        throw new Error("줄일 수량은 1 이상의 정수여야 합니다");
      }
      const key = stockKey(drawer, bookId);
      const current = entries.get(key);
      if (current === undefined) return 0;

      const quantity = Math.max(0, current.quantity - by);
      entries.set(key, parseDrawerStockEntry({ drawer, bookId, quantity }));
      return quantity;
    },
    async remove(drawer, bookId) {
      entries.delete(stockKey(drawer, bookId));
    },
  };
}
