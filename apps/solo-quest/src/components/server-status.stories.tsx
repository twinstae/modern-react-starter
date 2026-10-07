import type { Meta, StoryObj } from "@storybook/react-vite";

import { ServerStatus } from "./server-status.tsx";

const meta = {
  component: ServerStatus,
} satisfies Meta<typeof ServerStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Checking: Story = { args: { status: "checking" } };
export const Ok: Story = { args: { status: "ok" } };
export const Unreachable: Story = { args: { status: "unreachable" } };
