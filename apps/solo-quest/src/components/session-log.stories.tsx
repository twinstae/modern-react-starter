import type { Meta, StoryObj } from "@storybook/react-vite";

import type { MessageEntry } from "../domain/log-entries.ts";
import { SessionLog } from "./session-log.tsx";

const meta = {
  component: SessionLog,
} satisfies Meta<typeof SessionLog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 홀수 번째는 마스터 편 GM, 짝수 번째는 플레이어 편 Player */
const entry = (n: number): MessageEntry => ({
  kind: "message",
  id: `event-${n}`,
  side: n % 2 === 1 ? "master" : "player",
  speakerName: n % 2 === 1 ? "GM" : "Player",
  content: `${n}번째 기록`,
  createdAt: `2026-10-07T12:${String(n % 60).padStart(2, "0")}:00Z`,
});

export const Empty: Story = { args: { entries: [] } };
export const One: Story = {
  args: { entries: [{ ...entry(1), content: "문이 열린다" }] },
};
export const Ten: Story = {
  args: { entries: Array.from({ length: 10 }, (_, i) => entry(i + 1)) },
};
export const Many: Story = {
  args: { entries: Array.from({ length: 1000 }, (_, i) => entry(i + 1)) },
};
export const PlainText: Story = {
  args: {
    entries: [{ ...entry(1), content: "첫 줄\n**둘째 줄** `코드` # 제목" }],
  },
};
