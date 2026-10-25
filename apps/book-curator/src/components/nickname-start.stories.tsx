import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { NicknameStart } from "./nickname-start.tsx";

const noop = () => {};

export const nicknameStartArgs = {
  onStart: noop,
} satisfies ComponentProps<typeof NicknameStart>;

const meta = {
  component: NicknameStart,
  args: nicknameStartArgs,
} satisfies Meta<typeof NicknameStart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: nicknameStartArgs };

export const EmptyLandscape: Story = {
  args: nicknameStartArgs,
  globals: { viewport: { value: "tabletLandscape" } },
};

export const Error: Story = {
  args: {
    ...nicknameStartArgs,
    initialNickname: "열한글자가넘는아주긴별명",
    initialError: "별명은 10자까지 쓸 수 있어요",
  },
};
