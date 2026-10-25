import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import type { AnswerValue } from "../domain/answer.ts";
import { curate, type CustomerCuration } from "../domain/curate.ts";
import type { DrawerCode, Question } from "../domain/question-set.ts";
import { SEED_QUESTION_SET } from "../domain/seed-question-set.ts";
import { ResultScreen } from "./result-screen.tsx";

const noop = () => {};

const valueFor = (question: Question, drawer: DrawerCode): AnswerValue => {
  if (question.type === "item") return question.drawer === drawer ? 5 : 1;
  const option = question.options.at(0);
  if (option === undefined) throw new Error("선택형 질문에 선택지가 없습니다");
  return option.id;
};

/** 서랍 하나가 1순위가 되도록 그 서랍의 문항만 5, 나머지는 1로 답한다. */
const answersFirst = (drawer: DrawerCode): AnswerValue[] =>
  SEED_QUESTION_SET.questions.map((question) => valueFor(question, drawer));

/** B6와 B1이 같은 점수로 1·2순위가 되어 "비슷함"이 켜지는 답. */
const SIMILAR_ANSWERS: AnswerValue[] = SEED_QUESTION_SET.questions.map((question) => {
  if (question.type !== "item") return valueFor(question, "B6");
  return question.drawer === "B6" || question.drawer === "B1" ? 4 : 1;
});

const curationFor = (drawer: DrawerCode) => curate(SEED_QUESTION_SET, answersFirst(drawer), "토끼");

const DRAWER_CURATIONS = SEED_QUESTION_SET.drawers.map(({ code }) => ({
  drawer: code,
  customer: curationFor(code).customer,
}));

const customerOf = (drawer: DrawerCode): CustomerCuration => {
  const found = DRAWER_CURATIONS.find((entry) => entry.drawer === drawer);
  if (found === undefined) throw new Error(`시드에 없는 서랍입니다: ${drawer}`);
  return found.customer;
};

const argsOf = (customer: CustomerCuration, similar = false) =>
  ({
    customer,
    similar,
    ownerCheckNotice: null,
    onOwnerCheck: noop,
    onRetake: noop,
  }) satisfies ComponentProps<typeof ResultScreen>;

const seoyunBaseline = SEED_QUESTION_SET.baselines.find(({ name }) => name === "서윤");
if (seoyunBaseline === undefined) {
  throw new Error("시드 질문 세트에 서윤 기준 응답이 없습니다");
}

const longest = DRAWER_CURATIONS.reduce((long, entry) =>
  Array.from(entry.customer.firstStatement).length +
    Array.from(entry.customer.recommendedReason ?? "").length >
  Array.from(long.customer.firstStatement).length +
    Array.from(long.customer.recommendedReason ?? "").length
    ? entry
    : long,
);

export const resultScreenArgs = {
  seoyun: argsOf(curate(SEED_QUESTION_SET, seoyunBaseline.answers, "토끼").customer),
  similar: argsOf(curate(SEED_QUESTION_SET, SIMILAR_ANSWERS, "토끼").customer, true),
  longest: argsOf(longest.customer),
  drawerB6: argsOf(customerOf("B6")),
  drawerB1: argsOf(customerOf("B1")),
  drawerB4: argsOf(customerOf("B4")),
  drawerB2: argsOf(customerOf("B2")),
  drawerB7: argsOf(customerOf("B7")),
  drawerB3: argsOf(customerOf("B3")),
  drawerB5: argsOf(customerOf("B5")),
} satisfies Record<string, ComponentProps<typeof ResultScreen>>;

const meta = {
  component: ResultScreen,
  args: resultScreenArgs.seoyun,
} satisfies Meta<typeof ResultScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Seoyun: Story = {
  args: resultScreenArgs.seoyun,
  globals: { viewport: { value: "tabletPortrait" } },
};

export const SeoyunLandscape: Story = {
  args: resultScreenArgs.seoyun,
  globals: { viewport: { value: "tabletLandscape" } },
};

export const Similar: Story = {
  args: resultScreenArgs.similar,
  globals: { viewport: { value: "tabletPortrait" } },
};

export const Longest: Story = {
  args: resultScreenArgs.longest,
  globals: { viewport: { value: "tabletPortrait" } },
};

export const LongestLandscape: Story = {
  args: resultScreenArgs.longest,
  globals: { viewport: { value: "tabletLandscape" } },
};

export const DrawerB6: Story = { args: resultScreenArgs.drawerB6 };
export const DrawerB1: Story = { args: resultScreenArgs.drawerB1 };
export const DrawerB4: Story = { args: resultScreenArgs.drawerB4 };
export const DrawerB2: Story = { args: resultScreenArgs.drawerB2 };
export const DrawerB7: Story = { args: resultScreenArgs.drawerB7 };
export const DrawerB3: Story = { args: resultScreenArgs.drawerB3 };
export const DrawerB5: Story = { args: resultScreenArgs.drawerB5 };
