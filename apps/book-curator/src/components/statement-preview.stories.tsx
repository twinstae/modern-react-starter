import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { SEED_QUESTION_SET } from "../domain/seed-question-set.ts";
import { toQuestionSetDto } from "../domain/question-set.ts";
import { StatementPreview } from "./statement-preview.tsx";

const drawer = SEED_QUESTION_SET.drawers[0];
const question = SEED_QUESTION_SET.questions[0];

export const statementPreviewArgs = {
  drawerName: drawer?.name ?? "삶의 방식을 바꾸는 책",
  nickname: "토끼",
  statementTemplate: SEED_QUESTION_SET.statementTemplate,
  secondStatementTemplate: SEED_QUESTION_SET.secondStatementTemplate,
  citationTemplate: SEED_QUESTION_SET.citationTemplates.item,
  quote: question?.text ?? "요즘 생활에서 뭔가를 바꾸고 싶다",
} satisfies ComponentProps<typeof StatementPreview>;

const meta = {
  component: StatementPreview,
  args: statementPreviewArgs,
} satisfies Meta<typeof StatementPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: statementPreviewArgs,
};

export const LongDrawerName: Story = {
  args: {
    ...statementPreviewArgs,
    drawerName: "관계를 다시 생각하는 책",
    quote: "요즘 가까운 사람과의 거리가 고민이다",
  },
};

/** 위저드에서 쓰는 초안 모양. TICKET-00011 편집기 스토리와 테스트가 함께 쓴다. */
export const questionSetDraftArgs = {
  id: "draft-story",
  name: "11월 질문 세트",
  questionSet: toQuestionSetDto(SEED_QUESTION_SET),
  createdAt: "2026-10-25T00:00:00.000Z",
  updatedAt: "2026-10-25T00:00:00.000Z",
};
