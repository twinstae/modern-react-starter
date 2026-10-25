import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { SEED_QUESTION_SET } from "../domain/seed-question-set.ts";
import { SHELF_BOOKS } from "../domain/shelf.fixture.ts";
import { BookForm } from "./book-form.tsx";

const drawers = SEED_QUESTION_SET.drawers.map(({ code, name }) => ({ code, name }));
const sampleBook = SHELF_BOOKS[0];
if (sampleBook === undefined) throw new Error("서가 예시가 필요합니다");

export const bookFormArgs = {
  drawers,
  onSubmit: async () => undefined,
  onCancel: () => undefined,
  submitLabel: "책 저장",
} satisfies ComponentProps<typeof BookForm>;

const meta = {
  component: BookForm,
  args: bookFormArgs,
} satisfies Meta<typeof BookForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewBook: Story = {
  args: bookFormArgs,
};

export const Editing: Story = {
  args: { ...bookFormArgs, initial: sampleBook, submitLabel: "고친 내용 저장" },
};
