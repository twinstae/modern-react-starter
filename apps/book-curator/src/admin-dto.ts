import * as v from "valibot";

import { GATE_ISSUE_CODES } from "./domain/analyze.ts";
import { DrawerSchema } from "./domain/drawer.ts";

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
  readonly email: string;
  readonly password: string;
}

export function parseAdminMe(value: unknown): AdminMe {
  return v.parse(AdminMeSchema, value);
}

export const AdminDrawersSchema = v.array(DrawerSchema);

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

export const PublishBlockedSchema = v.strictObject({
  code: v.literal("PUBLISH_BLOCKED"),
  check: PublishCheckSchema,
});

/** 공개 버전 한 줄. 운영 화면은 지금 손님에게 나가는 버전을 보여 준다. */
export const PublishedVersionSummarySchema = v.strictObject({
  version: v.pipe(v.number(), v.integer(), v.minValue(1)),
  drawerCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
  questionCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

export type PublishedVersionSummaryDto = v.InferOutput<typeof PublishedVersionSummarySchema>;

/** 새로 만든 주인 PIN. 이 응답에서만 원문을 볼 수 있다. */
export const OwnerPinResultSchema = v.strictObject({ pin: v.string() });

export const AdminErrorSchema = v.strictObject({ code: v.string() });
