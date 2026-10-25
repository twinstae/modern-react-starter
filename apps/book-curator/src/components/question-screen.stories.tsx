import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import type { ItemQuestion } from "../domain/question-set.ts";
import { SEED_QUESTION_SET } from "../domain/seed-question-set.ts";
import { QuestionScreen } from "./question-screen.tsx";

const ITEM_QUESTIONS = SEED_QUESTION_SET.questions.filter(
  (question): question is ItemQuestion => question.type === "item",
);

const first = ITEM_QUESTIONS[0];
const last = ITEM_QUESTIONS[ITEM_QUESTIONS.length - 1];
const longest = ITEM_QUESTIONS.reduce((long, question) =>
  Array.from(question.text).length > Array.from(long.text).length ? question : long,
);

if (first === undefined || last === undefined) {
  throw new Error("시드 질문 세트에 문항형 질문이 없습니다");
}

const noop = () => {};

const argsFor = (question: ItemQuestion) => ({
  questionText: question.text,
  index: SEED_QUESTION_SET.questions.indexOf(question),
  total: SEED_QUESTION_SET.questions.length,
  onAnswer: noop,
  onBack: noop,
});

export const questionScreenArgs = {
  first: argsFor(first),
  longest: argsFor(longest),
  last: argsFor(last),
} satisfies Record<string, ComponentProps<typeof QuestionScreen>>;

const meta = {
  component: QuestionScreen,
  args: questionScreenArgs.first,
} satisfies Meta<typeof QuestionScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const First: Story = {
  args: questionScreenArgs.first,
  globals: { viewport: { value: "tabletPortrait" } },
};

export const Longest: Story = { args: questionScreenArgs.longest };

export const Last: Story = { args: questionScreenArgs.last };

export const LongestLandscape: Story = {
  args: questionScreenArgs.longest,
  globals: { viewport: { value: "tabletLandscape" } },
};
