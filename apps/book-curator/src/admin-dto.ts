import * as v from "valibot";

import { GATE_ISSUE_CODES, type GateIssueCode, type SetReport } from "./domain/analyze.ts";
import { BookSchema } from "./domain/book.ts";
import { DrawerCodeSchema, QuestionSetSchema, TextSchema } from "./domain/question-set.ts";
import { DrawerStockSchema, ShelfGateSchema } from "./domain/shelf.ts";

/** 운영자 서가 응답. 서랍 이름·표시는 공개 버전에서 읽기 전용으로 온다. */
export const AdminShelfSchema = v.strictObject({
  drawers: v.array(
    v.strictObject({
      code: DrawerCodeSchema,
      name: v.pipe(v.string(), v.minLength(1)),
      mark: v.nullable(v.pipe(v.string(), v.minLength(1))),
    }),
  ),
  books: v.array(BookSchema),
  stock: DrawerStockSchema,
  gate: ShelfGateSchema,
});

export type AdminShelf = v.InferOutput<typeof AdminShelfSchema>;

export function parseAdminShelf(value: unknown): AdminShelf {
  return v.parse(AdminShelfSchema, value);
}

/** 운영자 세션 응답의 경계 스키마. 서버 응답과 화면이 같은 스키마를 쓴다. */
export const AdminMeSchema = v.strictObject({
  user: v.strictObject({
    id: v.string(),
    name: v.string(),
    email: v.string(),
  }),
});

export type AdminMe = v.InferOutput<typeof AdminMeSchema>;

/** 로그인 폼이 운영 API로 넘기는 값. 비밀번호는 화면 밖으로 저장하지 않는다. */
export interface AdminCredentials {
  email: string;
  password: string;
}

export function parseAdminMe(value: unknown): AdminMe {
  return v.parse(AdminMeSchema, value);
}

const CountSchema = v.pipe(v.number(), v.integer(), v.minValue(0));

const DrawerRateSchema = v.strictObject({
  drawer: DrawerCodeSchema,
  firstCount: CountSchema,
  firstRate: v.number(),
  topTwoCount: CountSchema,
  topTwoRate: v.number(),
});

const DistributionReportSchema = v.strictObject({
  samples: CountSchema,
  decidedCount: CountSchema,
  decidedRate: v.number(),
  undecidedCount: CountSchema,
  undecidedRate: v.number(),
  tieBrokenByOrderCount: CountSchema,
  tieBrokenByOrderRate: v.number(),
  similarCount: CountSchema,
  similarRate: v.number(),
  byDrawer: v.array(DrawerRateSchema),
});

const DrawerStructureSchema = v.strictObject({
  drawer: DrawerCodeSchema,
  itemCount: CountSchema,
});

const BaselineResultSchema = v.strictObject({
  name: TextSchema,
  expectedFirst: DrawerCodeSchema,
  expectedSecond: DrawerCodeSchema,
  actualFirst: DrawerCodeSchema,
  actualSecond: DrawerCodeSchema,
  matches: v.boolean(),
});

const StructureReportSchema = v.strictObject({
  drawers: v.array(DrawerStructureSchema),
  emptyDrawers: v.array(DrawerCodeSchema),
  itemCountMin: CountSchema,
  itemCountMax: CountSchema,
  itemCountImbalance: CountSchema,
  balanced: v.boolean(),
  baselines: v.array(BaselineResultSchema),
});

const GateIssueSchema = v.strictObject({
  code: v.picklist(GATE_ISSUE_CODES),
  drawers: v.array(DrawerCodeSchema),
  baselines: v.array(TextSchema),
});

const GateReportSchema = v.strictObject({
  passed: v.boolean(),
  failures: v.array(GateIssueSchema),
  warnings: v.array(GateIssueSchema),
});

/** 공개 점검 응답. 서버가 도메인에서 만든 보고를 그대로 경계에서 확인한다. */
export const SetReportSchema = v.strictObject({
  sampleSize: v.pipe(v.number(), v.integer(), v.minValue(1)),
  sample: DistributionReportSchema,
  recorded: v.optional(DistributionReportSchema),
  structure: StructureReportSchema,
  gate: GateReportSchema,
});

export type SetReportDto = v.InferOutput<typeof SetReportSchema>;

/** 공개를 막는 이유. 점검 실패 코드 또는 서가 게이트다. */
export const PublishBlockerSchema = v.strictObject({
  code: v.picklist([...GATE_ISSUE_CODES, "shelf-gate"] as const),
  drawers: v.array(DrawerCodeSchema),
  baselines: v.array(TextSchema),
});

export type PublishBlockerDto = v.InferOutput<typeof PublishBlockerSchema>;

export const QuestionSetDraftSchema = v.strictObject({
  id: v.pipe(v.string(), v.minLength(1)),
  name: TextSchema,
  questionSet: QuestionSetSchema,
  createdAt: v.pipe(v.string(), v.minLength(1)),
  updatedAt: v.pipe(v.string(), v.minLength(1)),
});

export type QuestionSetDraftDto = v.InferOutput<typeof QuestionSetDraftSchema>;

export const QuestionSetDraftSummarySchema = v.strictObject({
  id: v.pipe(v.string(), v.minLength(1)),
  name: TextSchema,
  questionCount: CountSchema,
  updatedAt: v.pipe(v.string(), v.minLength(1)),
});

export type QuestionSetDraftSummaryDto = v.InferOutput<typeof QuestionSetDraftSummarySchema>;

export const QuestionSetDraftReportSchema = v.strictObject({
  report: SetReportSchema,
  shelfGate: ShelfGateSchema,
  canPublish: v.boolean(),
  blockers: v.array(PublishBlockerSchema),
});

export type QuestionSetDraftReportDto = v.InferOutput<typeof QuestionSetDraftReportSchema>;

export const PublishedQuestionSetVersionSchema = v.strictObject({
  version: v.pipe(v.number(), v.integer(), v.minValue(1)),
  drawerCount: CountSchema,
  questionCount: CountSchema,
});

export type PublishedQuestionSetVersionDto = v.InferOutput<
  typeof PublishedQuestionSetVersionSchema
>;

export const PublishQuestionSetResultSchema = v.strictObject({
  version: v.pipe(v.number(), v.integer(), v.minValue(1)),
});

export type PublishQuestionSetResultDto = v.InferOutput<typeof PublishQuestionSetResultSchema>;

export const PublishBlockedSchema = v.strictObject({
  code: v.literal("PUBLISH_BLOCKED"),
  blockers: v.array(PublishBlockerSchema),
  shelfGate: ShelfGateSchema,
});

export const AdminErrorSchema = v.strictObject({ code: v.string() });

/** 서버가 돌려준 점검을 화면 타입으로 파싱한다. */
export function parseQuestionSetDraftReport(value: unknown): QuestionSetDraftReportDto {
  return v.parse(QuestionSetDraftReportSchema, value);
}

export function parseQuestionSetDraft(value: unknown): QuestionSetDraftDto {
  return v.parse(QuestionSetDraftSchema, value);
}

export function parseQuestionSetDraftList(value: unknown): QuestionSetDraftSummaryDto[] {
  return v.parse(v.array(QuestionSetDraftSummarySchema), value);
}

export function parsePublishedQuestionSetVersions(
  value: unknown,
): PublishedQuestionSetVersionDto[] {
  return v.parse(v.array(PublishedQuestionSetVersionSchema), value);
}

export function parsePublishQuestionSetResult(value: unknown): PublishQuestionSetResultDto {
  return v.parse(PublishQuestionSetResultSchema, value);
}

export type { GateIssueCode };

const distributionDto = (report: {
  readonly samples: number;
  readonly decidedCount: number;
  readonly decidedRate: number;
  readonly undecidedCount: number;
  readonly undecidedRate: number;
  readonly tieBrokenByOrderCount: number;
  readonly tieBrokenByOrderRate: number;
  readonly similarCount: number;
  readonly similarRate: number;
  readonly byDrawer: readonly {
    readonly drawer: SetReport["sample"]["byDrawer"][number]["drawer"];
    readonly firstCount: number;
    readonly firstRate: number;
    readonly topTwoCount: number;
    readonly topTwoRate: number;
  }[];
}) => ({
  samples: report.samples,
  decidedCount: report.decidedCount,
  decidedRate: report.decidedRate,
  undecidedCount: report.undecidedCount,
  undecidedRate: report.undecidedRate,
  tieBrokenByOrderCount: report.tieBrokenByOrderCount,
  tieBrokenByOrderRate: report.tieBrokenByOrderRate,
  similarCount: report.similarCount,
  similarRate: report.similarRate,
  byDrawer: report.byDrawer.map((drawer) => ({
    drawer: drawer.drawer,
    firstCount: drawer.firstCount,
    firstRate: drawer.firstRate,
    topTwoCount: drawer.topTwoCount,
    topTwoRate: drawer.topTwoRate,
  })),
});

/** 도메인 점검 보고를 응답 모양으로 명시적으로 옮긴다. 읽기 전용 배열을 펼친다. */
export function toSetReportDto(report: SetReport): SetReportDto {
  return {
    sampleSize: report.sampleSize,
    sample: distributionDto(report.sample),
    ...(report.recorded === undefined ? {} : { recorded: distributionDto(report.recorded) }),
    structure: {
      drawers: report.structure.drawers.map(({ drawer, itemCount }) => ({ drawer, itemCount })),
      emptyDrawers: [...report.structure.emptyDrawers],
      itemCountMin: report.structure.itemCountMin,
      itemCountMax: report.structure.itemCountMax,
      itemCountImbalance: report.structure.itemCountImbalance,
      balanced: report.structure.balanced,
      baselines: report.structure.baselines.map(
        ({ name, expectedFirst, expectedSecond, actualFirst, actualSecond, matches }) => ({
          name,
          expectedFirst,
          expectedSecond,
          actualFirst,
          actualSecond,
          matches,
        }),
      ),
    },
    gate: {
      passed: report.gate.passed,
      failures: report.gate.failures.map(({ code, drawers, baselines }) => ({
        code,
        drawers: [...drawers],
        baselines: [...baselines],
      })),
      warnings: report.gate.warnings.map(({ code, drawers, baselines }) => ({
        code,
        drawers: [...drawers],
        baselines: [...baselines],
      })),
    },
  };
}
