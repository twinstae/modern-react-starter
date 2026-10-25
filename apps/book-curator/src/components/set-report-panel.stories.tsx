import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { analyze } from "../domain/analyze.ts";
import { seededRng } from "../domain/random.ts";
import { SEED_QUESTION_SET, SEED_RANDOM_SEED } from "../domain/seed-question-set.ts";
import { toSetReportDto, type QuestionSetDraftReportDto } from "../admin-dto.ts";
import { SetReportPanel } from "./set-report-panel.tsx";

const drawers = SEED_QUESTION_SET.drawers.map(({ code, name }) => ({ code, name }));
const passingReport = toSetReportDto(analyze(SEED_QUESTION_SET, seededRng(SEED_RANDOM_SEED)));

const passed: QuestionSetDraftReportDto = {
  report: passingReport,
  shelfGate: { passed: true, lacking: [] },
  canPublish: true,
  blockers: [],
};

const failingReport = toSetReportDto(analyze(SEED_QUESTION_SET, seededRng(SEED_RANDOM_SEED)));
failingReport.sample.byDrawer = failingReport.sample.byDrawer.map((rate, index) =>
  index < 2 ? { ...rate, firstRate: 0.5 } : rate,
);
failingReport.structure = {
  ...failingReport.structure,
  itemCountMin: 1,
  itemCountMax: 2,
  itemCountImbalance: 1,
  balanced: false,
  baselines: failingReport.structure.baselines.map((baseline) => ({
    ...baseline,
    actualFirst: baseline.expectedSecond,
    actualSecond: baseline.expectedFirst,
    matches: false,
  })),
};
failingReport.gate = {
  passed: false,
  failures: [
    { code: "sample-skew", drawers: ["B6", "B1"], baselines: [] },
    { code: "baseline-mismatch", drawers: ["B6", "B1"], baselines: ["서윤"] },
  ],
  warnings: [{ code: "item-count-imbalance", drawers: ["B1"], baselines: [] }],
};

const blocked: QuestionSetDraftReportDto = {
  report: failingReport,
  shelfGate: {
    passed: false,
    lacking: [{ drawer: "B1", name: "나를 들여다보는 책", kinds: 1 }],
  },
  canPublish: false,
  blockers: [
    { code: "sample-skew", drawers: ["B6", "B1"], baselines: [] },
    { code: "baseline-mismatch", drawers: ["B6", "B1"], baselines: ["서윤"] },
    { code: "shelf-gate", drawers: ["B1"], baselines: [] },
  ],
};

export const blockedReport = blocked;

export const setReportPanelArgs = {
  report: passed,
  drawers,
  onPublish: () => undefined,
} satisfies ComponentProps<typeof SetReportPanel>;

const meta = {
  component: SetReportPanel,
  args: setReportPanelArgs,
} satisfies Meta<typeof SetReportPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Passed: Story = {
  args: setReportPanelArgs,
};

export const Blocked: Story = {
  args: { ...setReportPanelArgs, report: blocked },
};

export const Published: Story = {
  args: {
    ...setReportPanelArgs,
    publishMessage: "공개 버전 2를 만들었어요.",
  },
};
