import * as v from "valibot";

/**
 * 책. 서가에 한 번 등록하고 여러 서랍에 넣을 수 있다.
 *
 * - `relevance`는 서랍별 참고도(0~5 정수)다. 저장하고 보여 주지만 추천에는 쓰지 않는다.
 * - `keywords`, `reason`, `question`은 큐레이터가 손님에게 건네는 문장의 재료다.
 */
const TextSchema = v.pipe(v.string(), v.trim(), v.minLength(1));

const RelevanceValueSchema = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(5));

/** 서랍 일곱 개 모두의 관련도. 빠진 서랍이나 모르는 서랍을 허용하지 않는다. */
export const BookRelevanceSchema = v.strictObject({
  B1: RelevanceValueSchema,
  B2: RelevanceValueSchema,
  B3: RelevanceValueSchema,
  B4: RelevanceValueSchema,
  B5: RelevanceValueSchema,
  B6: RelevanceValueSchema,
  B7: RelevanceValueSchema,
});

export type BookRelevance = v.InferOutput<typeof BookRelevanceSchema>;

export const BookIdSchema = TextSchema;

export const BookSchema = v.strictObject({
  id: BookIdSchema,
  title: TextSchema,
  author: TextSchema,
  relevance: BookRelevanceSchema,
  keywords: v.pipe(
    v.array(TextSchema),
    v.minLength(1),
    v.check(
      (keywords) => new Set(keywords).size === keywords.length,
      "핵심 단어는 겹치지 않아야 합니다",
    ),
  ),
  reason: TextSchema,
  question: TextSchema,
});

export type Book = v.InferOutput<typeof BookSchema>;

/** 책을 화면·저장소와 주고받는 평범한 객체. 도메인 값을 그대로 흘리지 않는다. */
export type BookDto = v.InferOutput<typeof BookSchema>;

/** 경계에서 책을 파싱한다. 관련도는 서랍 일곱 개가 모두 0~5 정수여야 한다. */
export function parseBook(value: unknown): Book {
  return v.parse(BookSchema, value);
}

/** 도메인 값을 DTO로 옮긴다. 관련도와 핵심 단어는 새 객체·배열로 복사한다. */
export function toBookDto(book: Book): BookDto {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    relevance: {
      B1: book.relevance.B1,
      B2: book.relevance.B2,
      B3: book.relevance.B3,
      B4: book.relevance.B4,
      B5: book.relevance.B5,
      B6: book.relevance.B6,
      B7: book.relevance.B7,
    },
    keywords: [...book.keywords],
    reason: book.reason,
    question: book.question,
  };
}

export function toBookJson(book: Book): string {
  return JSON.stringify(toBookDto(book));
}

export function parseBookJson(json: string): Book {
  return parseBook(JSON.parse(json));
}
