import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { SEED_QUESTION_SET } from "../domain/seed-question-set.ts";
import { SHELF_BOOKS, SHELF_STOCK } from "../domain/shelf.fixture.ts";
import { shelfKinds } from "../domain/shelf.ts";
import { DrawerBoard, type DrawerBoardDrawer } from "./drawer-board.tsx";

const bookById = new Map(SHELF_BOOKS.map((book) => [book.id, book]));

const drawers: DrawerBoardDrawer[] = SEED_QUESTION_SET.drawers.map(({ code, name, mark }) => ({
  code,
  name,
  mark,
  kinds: shelfKinds(SHELF_STOCK, code),
  books: SHELF_STOCK.filter((entry) => entry.drawer === code).map((entry) => {
    const book = bookById.get(entry.bookId);
    if (book === undefined) throw new Error(`서가 예시에 없는 책입니다: ${entry.bookId}`);
    return {
      bookId: book.id,
      title: book.title,
      author: book.author,
      quantity: entry.quantity,
    };
  }),
}));

const noop = () => undefined;

export const drawerBoardArgs = {
  drawers,
  books: SHELF_BOOKS.map(({ id, title }) => ({ bookId: id, title })),
  onAdd: noop,
  onSetQuantity: noop,
  onRemove: noop,
} satisfies ComponentProps<typeof DrawerBoard>;

const meta = {
  component: DrawerBoard,
  args: drawerBoardArgs,
} satisfies Meta<typeof DrawerBoard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GateFailure: Story = {
  args: drawerBoardArgs,
};

export const Empty: Story = {
  args: {
    ...drawerBoardArgs,
    drawers: drawers.map((drawer) => ({ ...drawer, kinds: 0, books: [] })),
  },
};
