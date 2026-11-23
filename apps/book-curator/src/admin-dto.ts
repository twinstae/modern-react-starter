import * as v from "valibot";

import type { PublishCheck } from "./application/drawer-admin.ts";
import { GATE_ISSUE_CODES } from "./domain/analyze.ts";

export const PUBLISH_ISSUE_CODES = [...GATE_ISSUE_CODES, "too-few-drawers", "few-books"] as const;

export const PublishIssueSchema = v.strictObject({
  code: v.picklist(PUBLISH_ISSUE_CODES),
  drawers: v.array(v.string()),
});

export type PublishIssueDto = v.InferOutput<typeof PublishIssueSchema>;

/** 공개 전 자동 점검. 실패가 없어야 공개할 수 있고, 경고는 알리기만 한다. */
export const PublishCheckSchema = v.strictObject({
  canPublish: v.boolean(),
  failures: v.array(PublishIssueSchema),
  warnings: v.array(PublishIssueSchema),
});

export type PublishCheckDto = v.InferOutput<typeof PublishCheckSchema>;

export const toPublishCheckDto = (check: PublishCheck): PublishCheckDto => ({
  canPublish: check.canPublish,
  failures: check.failures.map(({ code, drawers }) => ({ code, drawers: [...drawers] })),
  warnings: check.warnings.map(({ code, drawers }) => ({ code, drawers: [...drawers] })),
});

/** 공개 버전 한 줄. 운영 화면은 지금 손님에게 나가는 버전을 보여 준다. */
export interface PublishedVersionSummaryDto {
  readonly version: number;
  readonly drawerCount: number;
  readonly questionCount: number;
}

/** 운영 화면에 들어갈 수 있는지. 비밀번호를 정하기 전, 로그인 전, 로그인한 뒤. */
export type AdminAccess = "unset" | "signed-out" | "signed-in";
