import * as v from "valibot";

import { BookIdSchema, type Book } from "./book.ts";
import {
  CitationTemplatesSchema,
  DrawerCodeSchema,
  DrawerSchema,
  parseQuestionSet,
  QuestionSchema,
  ScoringSchema,
  TextSchema,
  toQuestionSetDto,
  type QuestionSet,
} from "./question-set.ts";
import { DrawerQuantitySchema, MissingBookError, type DrawerStockEntry } from "./shelf.ts";

/**
 * 손님 화면에 보내는 질문 세트. 관리자만 보는 `baselines`는 묶음에 넣지 않는다.
 * 서랍 이름·표시·권하는 이유는 결과 화면이 쓰므로 함께 보낸다.
 */
export const PublicQuestionSetSchema = v.strictObject({
  drawers: v.pipe(v.array(DrawerSchema), v.minLength(2)),
  questions: v.pipe(v.array(QuestionSchema), v.minLength(1)),
  scoring: ScoringSchema,
  statementTemplate: TextSchema,
  secondStatementTemplate: TextSchema,
  citationTemplates: CitationTemplatesSchema,
});

export type PublicQuestionSetDto = v.InferOutput<typeof PublicQuestionSetSchema>;

/** 손님에게 보이는 서랍 속 책. 관련도·서랍 코드·점수 같은 운영 값은 넣지 않는다(I-9). */
export const PublicShelfBookSchema = v.strictObject({
  bookId: BookIdSchema,
  title: TextSchema,
  author: TextSchema,
  reason: TextSchema,
  question: TextSchema,
  quantity: DrawerQuantitySchema,
});

export type PublicShelfBookDto = v.InferOutput<typeof PublicShelfBookSchema>;

/** 공개 서가의 서랍 하나. 손님 화면은 건넨 서랍만 골라 그린다(TICKET-00012). */
export const PublicShelfDrawerSchema = v.strictObject({
  drawer: DrawerCodeSchema,
  books: v.array(PublicShelfBookSchema),
});

export const PublicShelfSchema = v.strictObject({
  drawers: v.array(PublicShelfDrawerSchema),
});

export type PublicShelfDto = v.InferOutput<typeof PublicShelfSchema>;

const PreparingSchema = v.strictObject({ status: v.literal("preparing") });

const ReadySchema = v.strictObject({
  status: v.literal("ready"),
  version: v.pipe(v.number(), v.integer(), v.minValue(1)),
  questionSet: PublicQuestionSetSchema,
  shelf: PublicShelfSchema,
});

/** 손님 앱이 받는 공개 묶음의 응답 모양. */
export const KioskCurrentSchema = v.variant("status", [PreparingSchema, ReadySchema]);

export type KioskCurrentDto = v.InferOutput<typeof KioskCurrentSchema>;

export interface ReadyKioskBundle {
  readonly status: "ready";
  readonly version: number;
  readonly questionSet: QuestionSet;
  readonly shelf: PublicShelfDto;
}

export type KioskBundle = { readonly status: "preparing" } | ReadyKioskBundle;

/** 공개 버전을 손님 묶음으로 옮긴다. 필요한 필드만 명시적으로 고른다. */
export function toPublicQuestionSetDto(set: QuestionSet): PublicQuestionSetDto {
  const { questions } = toQuestionSetDto(set);

  return {
    drawers: set.drawers.map(({ code, name, order, statement, mark, reason, keywords }) => ({
      code,
      name,
      order,
      statement,
      mark,
      reason,
      keywords: [...keywords],
    })),
    questions,
    scoring: { type: set.scoring.type },
    statementTemplate: set.statementTemplate,
    secondStatementTemplate: set.secondStatementTemplate,
    citationTemplates: {
      item: set.citationTemplates.item,
      choice: set.citationTemplates.choice,
    },
  };
}

export interface PublicShelfSource {
  readonly stock: readonly DrawerStockEntry[];
  readonly books: readonly Book[];
}

/**
 * 공개 서가를 만든다. 질문 세트의 모든 서랍을 담고, 수량 0인 책도 "없음"으로 남긴다(R-9).
 * 책마다 손님에게 필요한 필드만 명시적으로 고른다. 관련도는 어디에도 넣지 않는다.
 */
export function toPublicShelfDto(
  questionSet: QuestionSet,
  { stock, books }: PublicShelfSource,
): PublicShelfDto {
  const byId = new Map(books.map((book) => [book.id, book]));

  return {
    drawers: questionSet.drawers.map(({ code }) => ({
      drawer: code,
      books: stock
        .filter((entry) => entry.drawer === code)
        .map((entry) => {
          const book = byId.get(entry.bookId);
          if (book === undefined) throw new MissingBookError(entry.bookId, code);
          return {
            bookId: book.id,
            title: book.title,
            author: book.author,
            reason: book.reason,
            question: book.question,
            quantity: entry.quantity,
          };
        }),
    })),
  };
}

/** 공개 버전이 없으면 "준비 중", 있으면 그 버전의 질문 세트와 서가를 묶는다. */
export function toKioskCurrentDto(
  published: { readonly version: number; readonly questionSet: QuestionSet } | null,
  shelf: PublicShelfSource = { stock: [], books: [] },
): KioskCurrentDto {
  if (published === null) return { status: "preparing" };
  return {
    status: "ready",
    version: published.version,
    questionSet: toPublicQuestionSetDto(published.questionSet),
    shelf: toPublicShelfDto(published.questionSet, shelf),
  };
}

/**
 * 응답 경계에서 묶음을 파싱한다. 공개 묶음에는 `baselines`가 없으므로 손님 쪽
 * 질문 세트의 기준 응답은 빈 배열로 정규화된다.
 */
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
