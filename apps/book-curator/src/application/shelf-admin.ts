import type { BookStore, DrawerStockStore } from "./shelf-ports.ts";
import type { PublishedQuestionSetStore } from "./published-question-set-ports.ts";
import { parseBook, type Book, type BookInput } from "../domain/book.ts";
import type { Drawer, DrawerCode } from "../domain/question-set.ts";
import {
  checkShelfGate,
  parseDrawerStockEntry,
  type DrawerStockEntry,
  type ShelfGateResult,
} from "../domain/shelf.ts";

/** 서가에 없는 책을 고치거나 서랍에 넣으려 할 때 던진다. */
export class BookNotFoundError extends Error {
  readonly bookId: string;

  constructor(bookId: string) {
    super(`서가에 없는 책입니다: ${bookId}`);
    this.name = "BookNotFoundError";
    this.bookId = bookId;
  }
}

/** 공개된 질문 세트가 없어 서랍 이름·표시를 정할 수 없을 때 던진다. */
export class NoPublishedQuestionSetError extends Error {
  constructor() {
    super("공개된 질문 세트가 없습니다");
    this.name = "NoPublishedQuestionSetError";
  }
}

/**
 * 운영 화면이 한 번에 읽는 서가. 서랍 이름·표시는 지금 공개된 질문 세트에서 온다.
 * 서랍 데이터를 서가에 복사하지 않는다(I-11).
 */
export interface ShelfState {
  readonly drawers: readonly Drawer[];
  readonly books: readonly Book[];
  readonly stock: readonly DrawerStockEntry[];
  readonly gate: ShelfGateResult;
}

export async function listBooks(bookStore: BookStore): Promise<Book[]> {
  return bookStore.list();
}

/** id는 서버가 만든다. 클라이언트가 보낸 id를 믿지 않는다. */
export async function createBook(
  bookStore: BookStore,
  input: BookInput,
  id: string,
): Promise<Book> {
  const book = parseBook({ ...input, id });
  await bookStore.save(book);
  return book;
}

export async function updateBook(
  bookStore: BookStore,
  id: string,
  input: BookInput,
): Promise<Book> {
  if ((await bookStore.get(id)) === null) throw new BookNotFoundError(id);
  const book = parseBook({ ...input, id });
  await bookStore.save(book);
  return book;
}

/**
 * 책·서랍 속 책·게이트를 한 번에 읽는다. 공개 버전이 없으면 서랍 이름을 만들 수 없어
 * 호출자가 409로 답할 수 있게 이름 있는 오류를 던진다.
 */
export async function readShelf(
  bookStore: BookStore,
  stockStore: DrawerStockStore,
  publishedStore: PublishedQuestionSetStore,
): Promise<ShelfState> {
  const published = await publishedStore.current();
  if (published === null) throw new NoPublishedQuestionSetError();

  const [books, stock] = await Promise.all([bookStore.list(), stockStore.list()]);

  return {
    drawers: published.questionSet.drawers,
    books,
    stock,
    gate: checkShelfGate(stock, published.questionSet.drawers),
  };
}

/** 서랍에 책을 넣거나 수량을 고친다. 없는 책은 저장 전에 거부한다. */
export async function putDrawerBook(
  bookStore: BookStore,
  stockStore: DrawerStockStore,
  drawer: DrawerCode,
  bookId: string,
  quantity: number,
): Promise<void> {
  if ((await bookStore.get(bookId)) === null) throw new BookNotFoundError(bookId);

  const entry = parseDrawerStockEntry({ drawer, bookId, quantity });
  await stockStore.setQuantity(entry.drawer, entry.bookId, entry.quantity);
}

/** 서랍에서 책을 뺀다. 수량 0과 달리 목록에서 사라진다(R-9). */
export async function removeDrawerBook(
  bookStore: BookStore,
  stockStore: DrawerStockStore,
  drawer: DrawerCode,
  bookId: string,
): Promise<void> {
  if ((await bookStore.get(bookId)) === null) throw new BookNotFoundError(bookId);
  await stockStore.remove(drawer, bookId);
}
