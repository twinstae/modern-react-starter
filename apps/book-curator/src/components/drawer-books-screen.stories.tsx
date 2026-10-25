import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { drawerBooksView } from "../domain/owner-view.ts";
import type { DrawerCode } from "../domain/question-set.ts";
import { SHELF_BOOKS, SHELF_STOCK } from "../domain/shelf.fixture.ts";
import type { DrawerStockEntry } from "../domain/shelf.ts";
import { DrawerBooksScreen, type DrawerBooksScreenBook } from "./drawer-books-screen.tsx";

const noop = () => undefined;

const booksOf = (
  drawer: DrawerCode,
  stock: readonly DrawerStockEntry[],
): DrawerBooksScreenBook[] => {
  const entries = stock.filter((entry) => entry.drawer === drawer);
  return drawerBooksView({ code: drawer }, stock, SHELF_BOOKS).map((book, index) => {
    const entry = entries[index];
    if (entry === undefined) throw new Error(`서가 예시에 없는 서랍 속 책입니다: ${drawer}`);
    return { ...book, bookId: entry.bookId };
  });
};

/** 세 권 중 한 권이 수량 0인 서랍. 수량 0도 "없음"으로 남는다(R-9). */
const THREE_BOOKS_STOCK: readonly DrawerStockEntry[] = SHELF_STOCK.map((entry) =>
  entry.drawer === "B6" && entry.bookId === "book-b6-2" ? { ...entry, quantity: 0 } : entry,
);

export const drawerBooksArgs = {
  threeBooks: {
    drawer: { name: "삶의 방식을 바꾸는 책", mark: "1번 · 열쇠 1" },
    books: booksOf("B6", THREE_BOOKS_STOCK),
    canRecordPurchase: true,
    recordedBookIds: [],
    notice: null,
    onPurchase: noop,
    onFinish: noop,
  },
  tokenExpired: {
    drawer: { name: "삶의 방식을 바꾸는 책", mark: "1번 · 열쇠 1" },
    books: booksOf("B6", THREE_BOOKS_STOCK),
    canRecordPurchase: false,
    recordedBookIds: ["book-b6-1"],
    notice: "주인 확인 시간이 끝나 산 책 기록은 할 수 없어요.",
    onPurchase: noop,
    onFinish: noop,
  },
} satisfies Record<string, ComponentProps<typeof DrawerBooksScreen>>;

const meta = {
  component: DrawerBooksScreen,
  args: drawerBooksArgs.threeBooks,
} satisfies Meta<typeof DrawerBooksScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeBooks: Story = {
  args: drawerBooksArgs.threeBooks,
  globals: { viewport: { value: "tabletPortrait" } },
};

export const ThreeBooksLandscape: Story = {
  args: drawerBooksArgs.threeBooks,
  globals: { viewport: { value: "tabletLandscape" } },
};

export const TokenExpired: Story = {
  args: drawerBooksArgs.tokenExpired,
  globals: { viewport: { value: "tabletPortrait" } },
};
