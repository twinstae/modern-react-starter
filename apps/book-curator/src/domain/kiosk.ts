import * as v from "valibot";

import type { Drawer } from "./drawer.ts";
import {
  DrawerIdSchema,
  parseQuestionSet,
  QuestionSetSchema,
  questionSetFrom,
  TextSchema,
  toQuestionSetDto,
  type QuestionSet,
} from "./question-set.ts";

/** 공개 서가의 책. 주인 확인이 건넬 서랍을 고를 때 본다. 무슨 책인지 알아볼 값만 있다. */
export const PublicShelfBookSchema = v.strictObject({
  bookId: TextSchema,
  title: TextSchema,
  author: TextSchema,
  publisher: v.string(),
});

export type PublicShelfBookDto = v.InferOutput<typeof PublicShelfBookSchema>;

export const PublicShelfDrawerSchema = v.strictObject({
  drawer: DrawerIdSchema,
  books: v.array(PublicShelfBookSchema),
});

export const PublicShelfSchema = v.strictObject({
  drawers: v.array(PublicShelfDrawerSchema),
});

export type PublicShelfDto = v.InferOutput<typeof PublicShelfSchema>;

/**
 * 공개 버전의 내용. 공개하는 순간의 질문 세트와 서랍 속 책을 함께 얼린다(I-11).
 * 손님 차례 도중 운영자가 서랍을 고쳐도 시작한 버전으로 끝까지 간다.
 */
export const PublishedSnapshotSchema = v.strictObject({
  questionSet: QuestionSetSchema,
  shelf: PublicShelfSchema,
});

export interface PublishedSnapshot {
  readonly questionSet: QuestionSet;
  readonly shelf: PublicShelfDto;
}

/** 지금 서랍들로 공개할 내용을 만든다. 서랍 순서·문항 순서가 그대로 고정된다. */
export function snapshotOf(drawers: readonly Drawer[]): PublishedSnapshot {
  return {
    questionSet: questionSetFrom(drawers),
    shelf: {
      drawers: drawers.map(({ id, books }) => ({
        drawer: id,
        books: books.map(({ id: bookId, title, author, publisher }) => ({
          bookId,
          title,
          author,
          publisher,
        })),
      })),
    },
  };
}

export function parsePublishedSnapshot(value: unknown): PublishedSnapshot {
  return v.parse(PublishedSnapshotSchema, value);
}

/** 저장소와 API로 보내는 모양. 필요한 필드만 새 객체로 옮긴다. */
export function toPublishedSnapshotDto(snapshot: PublishedSnapshot): PublishedSnapshot {
  return {
    questionSet: toQuestionSetDto(snapshot.questionSet),
    shelf: {
      drawers: snapshot.shelf.drawers.map(({ drawer, books }) => ({
        drawer,
        books: books.map(({ bookId, title, author, publisher }) => ({
          bookId,
          title,
          author,
          publisher,
        })),
      })),
    },
  };
}

const PreparingSchema = v.strictObject({ status: v.literal("preparing") });

const ReadySchema = v.strictObject({
  status: v.literal("ready"),
  version: v.pipe(v.number(), v.integer(), v.minValue(1)),
  ...PublishedSnapshotSchema.entries,
});

/** 손님 앱이 받는 공개 묶음의 응답 모양. */
export const KioskCurrentSchema = v.variant("status", [PreparingSchema, ReadySchema]);

export type KioskCurrentDto = v.InferOutput<typeof KioskCurrentSchema>;

export interface ReadyKioskBundle extends PublishedSnapshot {
  readonly status: "ready";
  readonly version: number;
}

export type KioskBundle = { readonly status: "preparing" } | ReadyKioskBundle;

/** 공개 버전이 없으면 "준비 중", 있으면 그 버전의 질문 세트와 서가를 묶는다. */
export function toKioskCurrentDto(
  published: ({ readonly version: number } & PublishedSnapshot) | null,
): KioskCurrentDto {
  if (published === null) return { status: "preparing" };
  return { status: "ready", version: published.version, ...toPublishedSnapshotDto(published) };
}

/** 응답 경계에서 묶음을 파싱한다. */
export function parseKioskCurrent(value: unknown): KioskBundle {
  const dto = v.parse(KioskCurrentSchema, value);
  if (dto.status === "preparing") return { status: "preparing" };
  return {
    status: "ready",
    version: dto.version,
    questionSet: parseQuestionSet(dto.questionSet),
    shelf: dto.shelf,
  };
}
