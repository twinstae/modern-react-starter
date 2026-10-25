import fc from "fast-check";

import type { AnswerValue } from "./answer.ts";
import { parseBook, type Book, type BookRelevance } from "./book.ts";
import type { QuestionSet } from "./question-set.ts";
import { curatableAnsweredQuestionSetArbitrary } from "./question-set.arbitrary.ts";
import { parseDrawerStock, type DrawerStockEntry } from "./shelf.ts";

const BOOKS_PER_DRAWER = 3;

const FLAT_RELEVANCE: BookRelevance = { B1: 1, B2: 1, B3: 1, B4: 1, B5: 1, B6: 1, B7: 1 };

const bookId = (drawerIndex: number, bookIndex: number): string =>
  `book-${drawerIndex + 1}-${bookIndex + 1}`;

const makeBook = (drawerIndex: number, bookIndex: number): Book =>
  parseBook({
    id: bookId(drawerIndex, bookIndex),
    title: `무작위 책 ${drawerIndex + 1}-${bookIndex + 1}`,
    author: `지은이 ${drawerIndex + 1}-${bookIndex + 1}`,
    relevance: FLAT_RELEVANCE,
    keywords: [`단어 ${drawerIndex + 1}-${bookIndex + 1}`],
    reason: "이 책을 지금 건네고 싶은 이유",
    question: "이 책을 읽고 함께 생각해 볼 질문",
  });

export interface ShelvedQuestionSet {
  readonly questionSet: QuestionSet;
  readonly answers: readonly AnswerValue[];
  readonly books: readonly Book[];
  readonly stock: readonly DrawerStockEntry[];
}

/**
 * 큐레이션 가능한 질문 세트·답과, 모든 서랍에 책 3종씩 든 무작위 서가.
 * 수량은 0~3이라 0인 책이 섞이고, 순위는 답에 따라 달라진다.
 */
export const shelvedAnsweredQuestionSetArbitrary: fc.Arbitrary<ShelvedQuestionSet> =
  curatableAnsweredQuestionSetArbitrary.chain(({ questionSet, answers }) => {
    const drawers = questionSet.drawers;
    const books = drawers.flatMap((_, drawerIndex) =>
      Array.from({ length: BOOKS_PER_DRAWER }, (_, bookIndex) => makeBook(drawerIndex, bookIndex)),
    );
    const slotCount = drawers.length * BOOKS_PER_DRAWER;

    return fc
      .array(fc.integer({ min: 0, max: 3 }), {
        minLength: slotCount,
        maxLength: slotCount,
      })
      .map((quantities) => ({
        questionSet,
        answers,
        books,
        stock: parseDrawerStock(
          drawers.flatMap((drawer, drawerIndex) =>
            Array.from({ length: BOOKS_PER_DRAWER }, (_, bookIndex) => ({
              drawer: drawer.code,
              bookId: bookId(drawerIndex, bookIndex),
              quantity: quantities[drawerIndex * BOOKS_PER_DRAWER + bookIndex] ?? 0,
            })),
          ),
        ),
      }));
  });
