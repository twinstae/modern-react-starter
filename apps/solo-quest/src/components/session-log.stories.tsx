import type { Meta, StoryObj } from "@storybook/react-vite";

import type { MessageEntry, RollEntry } from "../domain/log-entries.ts";
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
  speakerId: n % 2 === 1 ? "gm" : "player",
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

/** 대화와 판정이 섞인 기록. 라벨이 있는 플레이어 판정과 라벨이 없는 마스터 판정이 있다. */
export const Mixed: Story = {
  args: {
    entries: [
      { ...entry(1), content: "자물쇠가 걸려 있다" },
      {
        kind: "roll",
        id: "event-2",
        side: "player",
        speakerId: "player",
        speakerName: "Player",
        notation: "2d6+1",
        terms: [
          { type: "dice", sign: 1, sides: 6, values: [4, 6] },
          { type: "constant", sign: 1, value: 1 },
        ],
        total: 11,
        label: "자물쇠 따기",
        createdAt: "2026-10-07T12:02:00Z",
      } satisfies RollEntry,
      {
        kind: "roll",
        id: "event-3",
        side: "master",
        speakerId: "guard",
        speakerName: "경비병",
        notation: "d20-1",
        terms: [
          { type: "dice", sign: 1, sides: 20, values: [13] },
          { type: "constant", sign: -1, value: 1 },
        ],
        total: 12,
        createdAt: "2026-10-07T12:03:00Z",
      } satisfies RollEntry,
    ],
  },
};

/** 같은 편의 같은 화자가 이어 말한 기록. 편이 바뀌면 같은 화자라도 다시 이름이 보인다. */
export const Consecutive: Story = {
  args: {
    entries: [
      { ...entry(1), content: "문이 열린다" },
      { ...entry(3), content: "안은 어둡다" },
      { ...entry(2), content: "들어간다" },
      { ...entry(5), content: "바닥이 삐걱인다" },
      { ...entry(6), side: "player", speakerId: "gm", speakerName: "GM", content: "혼잣말" },
    ],
  },
};

/**
 * 보관된 캐릭터(guard-1)의 지난 기록과, 같은 이름으로 새로 추가한 캐릭터(guard-2)의 기록.
 * 로그는 보관 여부를 모르고 이름만 보인다. 이름이 같아도 다른 캐릭터이므로 묶음은 나뉜다.
 */
export const ArchivedSpeaker: Story = {
  args: {
    entries: [
      { ...entry(1), speakerId: "guard-1", speakerName: "경비병", content: "멈춰라" },
      { ...entry(3), speakerId: "guard-1", speakerName: "경비병", content: "누구냐" },
      { ...entry(5), speakerId: "guard-2", speakerName: "경비병", content: "교대할 시간이다" },
      { ...entry(7), speakerId: "guard-2", speakerName: "경비병", content: "조용하군" },
    ],
  },
};
