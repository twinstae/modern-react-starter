import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { SEED_QUESTION_SET } from "../domain/seed-question-set.ts";
import { QuestionSetDraftBar } from "./question-set-draft-bar.tsx";

const drafts = [
  {
    id: "draft-1",
    name: "11월 질문 세트",
    questionCount: SEED_QUESTION_SET.questions.length,
    updatedAt: "2026-10-25T00:00:00.000Z",
  },
  {
    id: "draft-2",
    name: "공개 버전 1 복제",
    questionCount: 15,
    updatedAt: "2026-10-24T00:00:00.000Z",
  },
];

export const questionSetDraftBarArgs = {
  drafts,
  selectedId: "draft-1",
  onSelect: () => undefined,
  onCreate: () => undefined,
  onClone: () => undefined,
} satisfies ComponentProps<typeof QuestionSetDraftBar>;

const meta = {
  component: QuestionSetDraftBar,
  args: questionSetDraftBarArgs,
} satisfies Meta<typeof QuestionSetDraftBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: questionSetDraftBarArgs,
};

export const Empty: Story = {
  args: { ...questionSetDraftBarArgs, drafts: [], selectedId: null },
};

export const Saved: Story = {
  args: { ...questionSetDraftBarArgs, message: "초안을 저장했어요." },
};
