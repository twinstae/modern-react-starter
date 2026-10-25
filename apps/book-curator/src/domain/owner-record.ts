import * as v from "valibot";

import { BookIdSchema } from "./book.ts";
import { DrawerCodeSchema, TextSchema } from "./question-set.ts";

/** 공개 버전. 정답 표시에는 어느 버전으로 답했는지가 함께 남는다(I-16). */
const VersionSchema = v.pipe(v.number(), v.integer(), v.minValue(1));

/**
 * 주인이 실제로 건넨 서랍의 기록. 추천 서랍과 건넨 서랍을 함께 남겨
 * "추천과 다르게 건넴"이 기록에서 드러난다(R-7). 별명 자리는 없다(I-12).
 */
export const HandoverInputSchema = v.strictObject({
  sessionId: TextSchema,
  version: VersionSchema,
  recommended: DrawerCodeSchema,
  handed: DrawerCodeSchema,
});

export type HandoverInput = v.InferOutput<typeof HandoverInputSchema>;

export const HandoverRecordSchema = v.strictObject({
  id: v.pipe(v.number(), v.integer(), v.minValue(1)),
  ...HandoverInputSchema.entries,
});

export type HandoverRecord = v.InferOutput<typeof HandoverRecordSchema>;

/** 주인이 기록한 산 책. 서랍 속 수량은 참고이고, 이 기록이 학습 데이터의 정답이다. */
export const PurchaseInputSchema = v.strictObject({
  sessionId: TextSchema,
  version: VersionSchema,
  drawer: DrawerCodeSchema,
  bookId: BookIdSchema,
});

export type PurchaseInput = v.InferOutput<typeof PurchaseInputSchema>;

export const PurchaseRecordSchema = v.strictObject({
  id: v.pipe(v.number(), v.integer(), v.minValue(1)),
  ...PurchaseInputSchema.entries,
});

export type PurchaseRecord = v.InferOutput<typeof PurchaseRecordSchema>;

export function parseHandoverInput(value: unknown): HandoverInput {
  return v.parse(HandoverInputSchema, value);
}

export function parseHandoverRecord(value: unknown): HandoverRecord {
  return v.parse(HandoverRecordSchema, value);
}

export function parsePurchaseInput(value: unknown): PurchaseInput {
  return v.parse(PurchaseInputSchema, value);
}

export function parsePurchaseRecord(value: unknown): PurchaseRecord {
  return v.parse(PurchaseRecordSchema, value);
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

export function toPurchaseRecordDto(record: PurchaseRecord): PurchaseRecord {
  return {
    id: record.id,
    sessionId: record.sessionId,
    version: record.version,
    drawer: record.drawer,
    bookId: record.bookId,
  };
}
