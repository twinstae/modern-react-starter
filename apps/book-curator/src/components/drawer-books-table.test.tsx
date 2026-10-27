import { describe, expect, it } from "vite-plus/test";
import { actions, given, query, runSiheom } from "@siheom/react";

import type { BookInput } from "../domain/drawer.ts";
import { DrawerBooksTable } from "./drawer-books-table.tsx";
import * as Stories from "./drawer-books-table.stories.tsx";

describe("DrawerBooksTable", () => {
  it("책을 고치면 고친 제목·저자·출판사로 남고, 빼면 그 책이 빠진다", async () => {
    const updated: [string, BookInput][] = [];
    const removed: string[] = [];

    await runSiheom(
      given.render(
        <DrawerBooksTable
          {...Stories.drawerBooksTableArgs}
          onUpdate={async (bookId, book) => {
            updated.push([bookId, book]);
            return undefined;
          }}
          onRemove={(bookId) => {
            removed.push(bookId);
          }}
        />,
      ),
      actions.click(query.button("삶을 바꾸는 연습 고치기")),
      actions.fill(query.textbox("출판사"), "새 출판사"),
      actions.click(query.button("고친 내용 저장")),
      actions.click(query.button("작은 습관 빼기")),
    );

    expect(updated).toStrictEqual([
      ["b1", { title: "삶을 바꾸는 연습", author: "김연습", publisher: "새 출판사" }],
    ]);
    expect(removed).toStrictEqual(["b2"]);
  });
});
