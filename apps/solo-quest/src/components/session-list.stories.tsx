import type { Meta, StoryObj } from "@storybook/react-vite";

import { SessionList } from "./session-list.tsx";

const meta = {
  component: SessionList,
} satisfies Meta<typeof SessionList>;

export default meta;
type Story = StoryObj<typeof meta>;

const session = (n: number) => ({
  id: `session-${n}`,
  title: `모험 ${n}`,
  createdAt: `2026-10-${String((n % 28) + 1).padStart(2, "0")}T09:00:00Z`,
});

export const Empty: Story = { args: { sessions: [] } };
export const One: Story = {
  args: { sessions: [{ id: "session-1", title: "첫 모험", createdAt: "2026-10-07T12:00:00Z" }] },
};
export const Ten: Story = {
  args: { sessions: Array.from({ length: 10 }, (_, i) => session(i + 1)) },
};
export const Many: Story = {
  args: { sessions: Array.from({ length: 1000 }, (_, i) => session(i + 1)) },
};
