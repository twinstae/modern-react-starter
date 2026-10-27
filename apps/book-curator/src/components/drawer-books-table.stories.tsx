import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { DrawerBooksTable } from "./drawer-books-table.tsx";

export const drawerBooksTableArgs = {
  books: [
    { id: "b1", title: "삶을 바꾸는 연습", author: "김연습", publisher: "연습출판" },
    { id: "b2", title: "작은 습관", author: "박습관", publisher: "" },
  ],
  onAdd: async () => undefined,
  onUpdate: async () => undefined,
  onRemove: () => {},
} satisfies ComponentProps<typeof DrawerBooksTable>;

const meta = {
  component: DrawerBooksTable,
  args: drawerBooksTableArgs,
} satisfies Meta<typeof DrawerBooksTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoBooks: Story = {};

export const NoBooks: Story = {
  args: { books: [] },
};
