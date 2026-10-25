import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { SEED_QUESTION_SET } from "../domain/seed-question-set.ts";
import { QuestionPreview } from "./question-preview.tsx";

const question = SEED_QUESTION_SET.questions[0];

export const questionPreviewArgs = {
  drawerName: "삶의 방식을 바꾸는 책",
  questionText: question?.text ?? "요즘 생활에서 뭔가를 바꾸고 싶다",
  index: 0,
  total: SEED_QUESTION_SET.questions.length,
} satisfies ComponentProps<typeof QuestionPreview>;

const meta = {
  component: QuestionPreview,
  args: questionPreviewArgs,
} satisfies Meta<typeof QuestionPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: questionPreviewArgs,
};

export const LongQuestion: Story = {
  args: {
    ...questionPreviewArgs,
    questionText: "내가 당연하게 여긴 삶의 방식을 다른 사람의 하루와 견주어 다시 보고 싶다",
    index: 6,
  },
};
