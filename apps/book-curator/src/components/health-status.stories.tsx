import type { Meta, StoryObj } from "@storybook/react-vite";

import { HealthStatus } from "./health-status.tsx";

const meta = { component: HealthStatus } satisfies Meta<typeof HealthStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Healthy: Story = {
  args: { health: { status: "ok", checkedAt: "2026-10-25T00:00:00.000Z" } },
};
