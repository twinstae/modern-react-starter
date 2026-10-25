import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { curate, type Curation } from "../domain/curate.ts";
import { ownerView } from "../domain/owner-view.ts";
import { parseQuestionSet } from "../domain/question-set.ts";
import { SEOYUN_ANSWERS, SEOYUN_SET_INPUT } from "../domain/seoyun.fixture.ts";
import { SHELF_BOOKS, SHELF_STOCK } from "../domain/shelf.fixture.ts";
import type { DrawerStockEntry } from "../domain/shelf.ts";
import { OwnerCheckScreen } from "./owner-check-screen.tsx";

const noop = () => undefined;

const QUESTION_SET = parseQuestionSet({
  ...SEOYUN_SET_INPUT,
  drawers: SEOYUN_SET_INPUT.drawers.map((drawer, index) => ({
    ...drawer,
    mark: `${index + 1}번 · 열쇠 ${index + 1}`,
  })),
});

const curation = curate(QUESTION_SET, SEOYUN_ANSWERS, "토끼");

/** B6와 B1을 같은 점수로 답해 "비슷함"이 켜지는 결과. */
const similarCuration: Curation = curate(
  QUESTION_SET,
  SEOYUN_ANSWERS.map((answer, index) => {
    const question = QUESTION_SET.questions[index];
    if (question?.type !== "item") return answer;
    return question.drawer === "B6" || question.drawer === "B1" ? 4 : 1;
  }),
  "토끼",
);

/** B6의 책 하나를 수량 0으로 두어 추천 서랍도 3종 미만이 되는 서가. */
const lowStock: readonly DrawerStockEntry[] = SHELF_STOCK.map((entry) =>
  entry.drawer === "B6" && entry.bookId === "book-b6-3" ? { ...entry, quantity: 0 } : entry,
);

const viewOf = (selected: Curation, stock: readonly DrawerStockEntry[] = SHELF_STOCK) =>
  ownerView(selected, stock, SHELF_BOOKS);

const argsOf = (
  selected: Curation,
  stock: readonly DrawerStockEntry[] = SHELF_STOCK,
): ComponentProps<typeof OwnerCheckScreen> => ({
  view: viewOf(selected, stock),
  notice: null,
  onHandover: noop,
  onCancel: noop,
});

export const ownerCheckArgs = {
  normal: argsOf(curation),
  similar: argsOf(similarCuration),
  belowMinimum: argsOf(curation, lowStock),
} satisfies Record<string, ComponentProps<typeof OwnerCheckScreen>>;

const meta = {
  component: OwnerCheckScreen,
  args: ownerCheckArgs.normal,
} satisfies Meta<typeof OwnerCheckScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: ownerCheckArgs.normal,
  globals: { viewport: { value: "tabletPortrait" } },
};

export const NormalLandscape: Story = {
  args: ownerCheckArgs.normal,
  globals: { viewport: { value: "tabletLandscape" } },
};

export const Similar: Story = {
  args: ownerCheckArgs.similar,
  globals: { viewport: { value: "tabletPortrait" } },
};

export const SimilarLandscape: Story = {
  args: ownerCheckArgs.similar,
  globals: { viewport: { value: "tabletLandscape" } },
};

export const BelowMinimum: Story = {
  args: ownerCheckArgs.belowMinimum,
  globals: { viewport: { value: "tabletPortrait" } },
};

export const BelowMinimumLandscape: Story = {
  args: ownerCheckArgs.belowMinimum,
  globals: { viewport: { value: "tabletLandscape" } },
};
