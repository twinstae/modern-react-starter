import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { parseBook, type Book } from "../domain/book.ts";
import { SEED_QUESTION_SET } from "../domain/seed-question-set.ts";
import { SHELF_BOOKS } from "../domain/shelf.fixture.ts";
import { BookList } from "./book-list.tsx";

const drawers = SEED_QUESTION_SET.drawers.map(({ code, name }) => ({ code, name }));
const noop = () => undefined;

export const bookListArgs = {
  books: SHELF_BOOKS.slice(0, 1),
  drawers,
  onEdit: noop,
} satisfies ComponentProps<typeof BookList>;

const sample = SHELF_BOOKS[0];
if (sample === undefined) throw new Error("서가 예시가 필요합니다");

const fiftyBooks: Book[] = Array.from({ length: 50 }, (_, index) =>
  parseBook({
    ...sample,
    id: `book-story-${index + 1}`,
    title: `${sample.title} ${index + 1}`,
    keywords: [`단어${index + 1}`],
    relevance: { ...sample.relevance, B6: index % 6 },
  }),
);

const meta = {
  component: BookList,
  args: bookListArgs,
} satisfies Meta<typeof BookList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: { ...bookListArgs, books: [] },
};

export const OneBook: Story = {
  args: bookListArgs,
};

export const FiftyBooks: Story = {
  args: { ...bookListArgs, books: fiftyBooks },
};
