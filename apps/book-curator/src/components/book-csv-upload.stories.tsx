import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { BookCsvUpload } from "./book-csv-upload.tsx";

export const bookCsvUploadArgs: ComponentProps<typeof BookCsvUpload> = {
  onUpload: async () => undefined,
};

const meta = {
  component: BookCsvUpload,
  args: bookCsvUploadArgs,
} satisfies Meta<typeof BookCsvUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 양식 안내와 파일 고르기. 파일을 고르면 읽은 책을 먼저 보여 준다. */
export const Empty: Story = {};

export const UploadFails: Story = {
  args: { onUpload: async () => "잠시 뒤 다시 시도해 주세요" },
};
