import type { Meta, StoryObj } from "@storybook/react-vite";

import { Textarea } from "./textarea.tsx";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  args: {
    "aria-label": "내용",
    placeholder: "내용을 입력하세요",
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { defaultValue: "첫 줄\n둘째 줄" },
};

export const Invalid: Story = {
  args: { "aria-invalid": true },
};
