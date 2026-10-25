import { describe, expect, it } from "vite-plus/test";

import { parseBook, parseBookJson, toBookDto, toBookJson, type Book } from "./book.ts";

const BOOK_INPUT = {
  id: "book-b6-1",
  title: "삶을 바꾸는 연습",
  author: "김연습",
  relevance: { B1: 4, B2: 1, B3: 2, B4: 1, B5: 0, B6: 5, B7: 3 },
  keywords: ["삶", "연습"],
  reason: "지금 삶의 방식을 조금씩 바꿔 보고 싶은 손님에게",
  question: "이번 주에 바꿔 볼 수 있는 작은 하나는 무엇인가요?",
} as const;

describe("BookSchema", () => {
  it("책 한 권을 파싱해 도메인 값으로 만든다", () => {
    expect(parseBook(BOOK_INPUT)).toStrictEqual(BOOK_INPUT);
  });

  it("관련도는 서랍 일곱 개 모두 0~5 정수여야 한다", () => {
    expect(() =>
      parseBook({ ...BOOK_INPUT, relevance: { ...BOOK_INPUT.relevance, B6: 6 } }),
    ).toThrow();
    expect(() =>
      parseBook({ ...BOOK_INPUT, relevance: { ...BOOK_INPUT.relevance, B1: -1 } }),
    ).toThrow();
    expect(() =>
      parseBook({ ...BOOK_INPUT, relevance: { ...BOOK_INPUT.relevance, B2: 1.5 } }),
    ).toThrow();

    const { B7: _removed, ...missing } = BOOK_INPUT.relevance;
    expect(() => parseBook({ ...BOOK_INPUT, relevance: missing })).toThrow();
    expect(() =>
      parseBook({ ...BOOK_INPUT, relevance: { ...BOOK_INPUT.relevance, B8: 1 } }),
    ).toThrow();
  });

  it("핵심 단어·제목·저자·이유·질문이 비면 거부한다", () => {
    expect(() => parseBook({ ...BOOK_INPUT, keywords: [] })).toThrow();
    expect(() => parseBook({ ...BOOK_INPUT, keywords: ["삶", "삶"] })).toThrow();
    expect(() => parseBook({ ...BOOK_INPUT, title: "   " })).toThrow();
    expect(() => parseBook({ ...BOOK_INPUT, author: "" })).toThrow();
    expect(() => parseBook({ ...BOOK_INPUT, reason: "" })).toThrow();
    expect(() => parseBook({ ...BOOK_INPUT, question: "" })).toThrow();
  });

  it("모르는 필드를 거부한다", () => {
    expect(() => parseBook({ ...BOOK_INPUT, stock: 2 })).toThrow();
  });

  it("DTO와 JSON 왕복에도 같은 책이다", () => {
    const book: Book = parseBook(BOOK_INPUT);
    const dto = toBookDto(book);

    expect(parseBook(dto)).toStrictEqual(book);
    expect(parseBookJson(toBookJson(book))).toStrictEqual(book);
    expect(dto).not.toBe(book);
    expect(dto.relevance).not.toBe(book.relevance);
    expect(dto.keywords).not.toBe(book.keywords);
  });
});
