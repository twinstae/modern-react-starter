import { beforeEach, describe, expect, it } from "vite-plus/test";

import {
  BookNotFoundError,
  DrawerNotFoundError,
  type DrawerStore,
} from "../application/drawer-ports.ts";

const book = (id: string, title: string) => ({ id, title, author: "저자", publisher: "" });

/** 메모리와 PGlite 구현이 함께 통과하는 서랍 저장소 계약. `setup`은 빈 저장소를 준다. */
export function drawerStoreContract(name: string, setup: () => Promise<DrawerStore>): void {
  describe(`${name} 서랍 저장소 계약`, () => {
    let store: DrawerStore;

    beforeEach(async () => {
      store = await setup();
    });

    it("서랍을 만든 순서대로 돌려주고, 새 서랍은 문항과 책이 비어 있다", async () => {
      await store.create({ id: "a", name: "가 서랍" });
      await store.create({ id: "b", name: "나 서랍" });

      expect(await store.list()).toStrictEqual([
        { id: "a", name: "가 서랍", questions: [], books: [] },
        { id: "b", name: "나 서랍", questions: [], books: [] },
      ]);
    });

    it("이름과 문항을 고친다", async () => {
      await store.create({ id: "a", name: "가 서랍" });

      await store.update("a", { questions: ["첫 문항", "둘째 문항"] });
      const renamed = await store.update("a", { name: "새 이름" });

      expect(renamed).toStrictEqual({
        id: "a",
        name: "새 이름",
        questions: ["첫 문항", "둘째 문항"],
        books: [],
      });
    });

    it("책을 넣은 순서대로 두고, 고치고, 뺀다", async () => {
      await store.create({ id: "a", name: "가 서랍" });
      await store.addBooks("a", [book("1", "첫 책"), book("2", "둘째 책")]);
      await store.addBooks("a", [book("3", "셋째 책")]);

      await store.updateBook("a", "2", { title: "고친 책", author: "새 저자", publisher: "출판" });
      const drawer = await store.removeBook("a", "1");

      expect(drawer.books).toStrictEqual([
        { id: "2", title: "고친 책", author: "새 저자", publisher: "출판" },
        book("3", "셋째 책"),
      ]);
    });

    it("서랍을 지우면 그 책도 사라진다", async () => {
      await store.create({ id: "a", name: "가 서랍" });
      await store.create({ id: "b", name: "나 서랍" });
      await store.addBooks("a", [book("1", "첫 책")]);

      await store.remove("a");

      expect(await store.list()).toStrictEqual([
        { id: "b", name: "나 서랍", questions: [], books: [] },
      ]);
    });

    it("없는 서랍이나 다른 서랍의 책을 고치면 이름 있는 오류를 던진다", async () => {
      await store.create({ id: "a", name: "가 서랍" });
      await store.create({ id: "b", name: "나 서랍" });
      await store.addBooks("a", [book("1", "첫 책")]);

      await expect(store.update("x", { name: "없음" })).rejects.toThrow(DrawerNotFoundError);
      await expect(store.remove("x")).rejects.toThrow(DrawerNotFoundError);
      await expect(store.addBooks("x", [book("2", "책")])).rejects.toThrow(DrawerNotFoundError);
      await expect(store.removeBook("b", "1")).rejects.toThrow(BookNotFoundError);
      await expect(
        store.updateBook("b", "1", { title: "책", author: "저자", publisher: "" }),
      ).rejects.toThrow(BookNotFoundError);
    });
  });
}
