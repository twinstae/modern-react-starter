import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { toQuestionSetDto } from "../domain/question-set.ts";
import { SEED_QUESTION_SET } from "../domain/seed-question-set.ts";
import { QuestionSetEditor } from "./question-set-editor.tsx";

const draft = {
  id: "draft-story",
  name: "11월 질문 세트",
  questionSet: toQuestionSetDto(SEED_QUESTION_SET),
  createdAt: "2026-10-25T00:00:00.000Z",
  updatedAt: "2026-10-25T00:00:00.000Z",
};

export const questionSetEditorArgs: ComponentProps<typeof QuestionSetEditor> = {
  draft,
  onSave: async () => undefined,
};

const meta = {
  component: QuestionSetEditor,
  args: questionSetEditorArgs,
} satisfies Meta<typeof QuestionSetEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: questionSetEditorArgs,
};

export const SaveFailure: Story = {
  args: {
    ...questionSetEditorArgs,
    onSave: async (): Promise<string | undefined> =>
      "질문 세트를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요",
  },
};
