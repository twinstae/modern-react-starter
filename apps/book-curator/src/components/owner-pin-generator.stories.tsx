import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { OwnerPinGenerator } from "./owner-pin-generator.tsx";

export const ownerPinGeneratorArgs: ComponentProps<typeof OwnerPinGenerator> = {
  onGenerate: async () => ({ pin: "048213" }),
};

const meta = {
  component: OwnerPinGenerator,
  args: ownerPinGeneratorArgs,
} satisfies Meta<typeof OwnerPinGenerator>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 누르면 새 PIN이 한 번 보인다. */
export const Generate: Story = {};

export const Fails: Story = {
  args: { onGenerate: async () => ({ error: "로그인이 풀렸어요. 다시 로그인해 주세요" }) },
};
