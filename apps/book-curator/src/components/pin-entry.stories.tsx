import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { PinEntry } from "./pin-entry.tsx";

const submit = async () => undefined;

export const pinEntryArgs = {
  onSubmit: submit,
} satisfies ComponentProps<typeof PinEntry>;

const meta = {
  component: PinEntry,
  args: pinEntryArgs,
} satisfies Meta<typeof PinEntry>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unlock: Story = {
  args: pinEntryArgs,
};

export const SetPin: Story = {
  args: {
    ...pinEntryArgs,
    title: "새 주인 PIN",
    submitLabel: "저장",
  },
};

export const Error: Story = {
  args: {
    ...pinEntryArgs,
    initialError: "PIN이 맞지 않아요",
  },
};
