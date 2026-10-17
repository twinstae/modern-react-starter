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
  status: "committed",
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
        status: "committed",
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
        status: "committed",
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

/** 저장된 기록 뒤에 저장 중인 기록과 저장하지 못한 기록이 이어진다. 저장된 기록에는 표시가 없다. */
export const Unsaved: Story = {
  args: {
    entries: [
      { ...entry(1), content: "문이 열린다" },
      { ...entry(2), status: "pending", content: "안으로 들어간다" },
      { ...entry(3), status: "failed", content: "안은 어둡다" },
    ],
  },
};

/** 판정도 같은 방식으로 저장 중이다 */
export const PendingRoll: Story = {
  args: {
    entries: [
      {
        kind: "roll",
        id: "event-1",
        status: "pending",
        side: "player",
        speakerId: "player",
        speakerName: "Player",
        notation: "d20",
        terms: [{ type: "dice", sign: 1, sides: 20, values: [17] }],
        total: 17,
        createdAt: "2026-10-07T12:01:00Z",
      } satisfies RollEntry,
    ],
  },
};

/** 판정 하나만 있는 기록. 표기와 굴린 항만 바꿔 쓴다. */
const rollEntry = (roll: Pick<RollEntry, "notation" | "terms" | "total"> & Partial<RollEntry>) =>
  ({
    kind: "roll",
    id: "event-1",
    status: "committed",
    side: "player",
    speakerId: "player",
    speakerName: "Player",
    createdAt: "2026-10-07T12:01:00Z",
    ...roll,
  }) satisfies RollEntry;

/** Fate 주사위 판정. 빼는 Fate 항도 있다. */
export const FateRoll: Story = {
  args: {
    entries: [
      rollEntry({
        notation: "4dF+3",
        terms: [
          { type: "fate", sign: 1, values: [1, 0, -1, 1] },
          { type: "constant", sign: 1, value: 3 },
        ],
        total: 4,
      }),
    ],
  },
};

/** 비교 판정들. 도전 주사위(약한 성공, 상한과 Match), 목표치(성공, 실패) */
export const CheckRolls: Story = {
  args: {
    entries: [
      rollEntry({
        id: "event-1",
        notation: "d6+2+1 max10 > 2d10",
        terms: [
          { type: "dice", sign: 1, sides: 6, values: [3] },
          { type: "constant", sign: 1, value: 2 },
          { type: "constant", sign: 1, value: 1 },
        ],
        total: 6,
        check: { op: ">", cap: 10, against: { type: "dice", sides: 10, values: [5, 7] } },
        label: "정찰",
      }),
      rollEntry({
        id: "event-2",
        notation: "d6+4+4 max10 > 2d10",
        terms: [
          { type: "dice", sign: 1, sides: 6, values: [6] },
          { type: "constant", sign: 1, value: 4 },
          { type: "constant", sign: 1, value: 4 },
        ],
        total: 14,
        check: { op: ">", cap: 10, against: { type: "dice", sides: 10, values: [9, 9] } },
      }),
      rollEntry({
        id: "event-3",
        side: "master",
        speakerId: "gm",
        speakerName: "GM",
        notation: "d20 >= 3*3",
        terms: [{ type: "dice", sign: 1, sides: 20, values: [12] }],
        total: 12,
        check: { op: ">=", against: { type: "number", value: 9 } },
      }),
      rollEntry({
        id: "event-4",
        notation: "3d6 <= 12",
        terms: [{ type: "dice", sign: 1, sides: 6, values: [6, 6, 1] }],
        total: 13,
        check: { op: "<=", against: { type: "number", value: 12 } },
      }),
    ],
  },
};

/** 매크로로 굴린 판정들. 결과 이름만 있는 것(던전월드)과 눈 효과까지 있는 것(Cypher) */
export const MacroRolls: Story = {
  args: {
    entries: [
      rollEntry({
        id: "event-1",
        notation: "2d6+1",
        terms: [
          { type: "dice", sign: 1, sides: 6, values: [3, 5] },
          { type: "constant", sign: 1, value: 1 },
        ],
        total: 9,
        label: "위험을 무릅쓰기",
        outcome: "약한 성공",
      }),
      rollEntry({
        id: "event-2",
        notation: "d20 >= 3*3",
        terms: [{ type: "dice", sign: 1, sides: 20, values: [20] }],
        total: 20,
        check: { op: ">=", against: { type: "number", value: 9 } },
        label: "과제 판정",
        outcome: "성공",
        effect: "큰 이득",
      }),
    ],
  },
};
