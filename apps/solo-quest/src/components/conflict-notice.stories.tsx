import type { Meta, StoryObj } from "@storybook/react-vite";

import { ConflictNotice } from "./conflict-notice.tsx";

const meta = { component: ConflictNotice } satisfies Meta<typeof ConflictNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const None: Story = { args: {} };
export const Conflicted: Story = {
  args: { message: "다른 곳에서 먼저 기록했습니다. 최신 기록을 다시 불러왔습니다" },
};
