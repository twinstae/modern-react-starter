import * as v from "valibot";

import { DrawerIdSchema, TextSchema } from "./question-set.ts";

/** 공개 버전. 정답 표시에는 어느 버전으로 답했는지가 함께 남는다(I-16). */
const VersionSchema = v.pipe(v.number(), v.integer(), v.minValue(1));

/**
 * 주인이 실제로 건넨 서랍의 기록. 추천 서랍과 건넨 서랍을 함께 남겨
 * "추천과 다르게 건넴"이 기록에서 드러난다(R-7). 별명 자리는 없다(I-12).
 */
export const HandoverInputSchema = v.strictObject({
  sessionId: TextSchema,
  version: VersionSchema,
  recommended: DrawerIdSchema,
  handed: DrawerIdSchema,
});

export type HandoverInput = v.InferOutput<typeof HandoverInputSchema>;

export const HandoverRecordSchema = v.strictObject({
  id: v.pipe(v.number(), v.integer(), v.minValue(1)),
  ...HandoverInputSchema.entries,
});

export type HandoverRecord = v.InferOutput<typeof HandoverRecordSchema>;

export function parseHandoverInput(value: unknown): HandoverInput {
  return v.parse(HandoverInputSchema, value);
}

export function parseHandoverRecord(value: unknown): HandoverRecord {
  return v.parse(HandoverRecordSchema, value);
}

/** 저장소와 API로 보내는 기록 모양. 필요한 필드만 새 객체로 옮긴다. */
export function toHandoverRecordDto(record: HandoverRecord): HandoverRecord {
  return {
    id: record.id,
    sessionId: record.sessionId,
    version: record.version,
    recommended: record.recommended,
    handed: record.handed,
  };
}
