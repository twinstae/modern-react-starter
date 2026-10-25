import type { Book } from "../domain/book.ts";
import type { DrawerCode } from "../domain/question-set.ts";
import type { DrawerStockEntry } from "../domain/shelf.ts";

/**
 * 책 저장소. TICKET-00010의 유스케이스가 이 포트를 받고, 기억 구현과 PGlite 구현이
 * 같은 계약을 지킨다. 저장은 책 id로 덮어쓴다.
 */
export interface BookStore {
  list(): Promise<Book[]>;
  get(id: string): Promise<Book | null>;
  save(book: Book): Promise<void>;
}

/**
 * 서랍 속 책 저장소. (서랍, 책) 하나에 수량 하나다.
 * 수량 0은 줄을 지우지 않고 "없음"으로 남긴다(R-9).
 */
export interface DrawerStockStore {
  list(): Promise<DrawerStockEntry[]>;
  setQuantity(drawer: DrawerCode, bookId: string, quantity: number): Promise<void>;
  remove(drawer: DrawerCode, bookId: string): Promise<void>;
}
