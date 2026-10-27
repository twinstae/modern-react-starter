import type { BookInput, Drawer, DrawerBook } from "../domain/drawer.ts";

/** 없는 서랍을 읽거나 고치려 할 때 던진다. */
export class DrawerNotFoundError extends Error {
  constructor(readonly id: string) {
    super(`없는 서랍입니다: ${id}`);
    this.name = "DrawerNotFoundError";
  }
}

/** 서랍에 없는 책을 고치거나 빼려 할 때 던진다. */
export class BookNotFoundError extends Error {
  constructor(readonly id: string) {
    super(`서랍에 없는 책입니다: ${id}`);
    this.name = "BookNotFoundError";
  }
}

/**
 * 운영자가 고치는 서랍 저장소. 서랍은 만든 순서로, 책은 넣은 순서로 돌려준다.
 * 고치는 메서드는 고친 뒤의 서랍을 돌려주고, 없으면 이름 있는 오류를 던진다.
 */
export interface DrawerStore {
  list(): Promise<Drawer[]>;
  create(drawer: { readonly id: string; readonly name: string }): Promise<Drawer>;
  update(
    id: string,
    change: { readonly name?: string; readonly questions?: readonly string[] },
  ): Promise<Drawer>;
  remove(id: string): Promise<void>;
  addBooks(drawerId: string, books: readonly DrawerBook[]): Promise<Drawer>;
  updateBook(drawerId: string, bookId: string, input: BookInput): Promise<Drawer>;
  removeBook(drawerId: string, bookId: string): Promise<Drawer>;
}
