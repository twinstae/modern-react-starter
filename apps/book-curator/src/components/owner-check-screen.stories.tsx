import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { curate, type Curation } from "../domain/curate.ts";
import { snapshotOf } from "../domain/kiosk.ts";
import { ownerView } from "../domain/owner-view.ts";
import { SEED_DRAWERS, SEED_QUESTION_SET } from "../domain/seed-question-set.ts";
import { OwnerCheckScreen } from "./owner-check-screen.tsx";

const noop = () => undefined;

const { shelf } = snapshotOf(SEED_DRAWERS);

/** B6 문항에 가장 높게, B1 문항에 그다음으로 답한 결과. */
const curation = curate(
  SEED_QUESTION_SET,
  SEED_QUESTION_SET.questions.map(({ drawer }) => (drawer === "B6" ? 5 : drawer === "B1" ? 4 : 2)),
  "토끼",
);

/** B6와 B1을 같은 점수로 답해 "비슷함"이 켜지는 결과. */
const similarCuration: Curation = curate(
  SEED_QUESTION_SET,
  SEED_QUESTION_SET.questions.map(({ drawer }) => (drawer === "B6" || drawer === "B1" ? 4 : 1)),
  "토끼",
);

const argsOf = (selected: Curation): ComponentProps<typeof OwnerCheckScreen> => ({
  view: ownerView(selected, shelf),
  notice: null,
  onHandover: noop,
  onCancel: noop,
});

export const ownerCheckArgs = {
  normal: argsOf(curation),
  similar: argsOf(similarCuration),
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
