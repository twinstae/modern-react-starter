import fc from "fast-check";

import type { AnswerValue } from "./answer.ts";
import { type FunnelAction, questionIdAt } from "./funnel.ts";
import type { DrawerId } from "./question-set.ts";
import type { DrawerScores } from "./scoring/index.ts";

const CODES = ["B1", "B2", "B3", "B4", "B5", "B6", "B7"] as const satisfies readonly DrawerId[];

const rankingArbitrary = fc
  .tuple(fc.constantFrom(...CODES), fc.constantFrom(...CODES))
  .filter(([first, second]) => first !== second)
  .map(([first, second]) => ({ first, second, similar: first < second }));

const scoresArbitrary: fc.Arbitrary<DrawerScores> = fc
  .array(
    fc.record({
      score: fc.double({ min: -5, max: 5, noNaN: true }),
      fives: fc.nat({ max: 20 }),
    }),
    { minLength: CODES.length, maxLength: CODES.length },
  )
  .map((rows) => ({
    scoring: "item-mean" as const,
    drawers: CODES.map((drawer, index) => ({
      drawer,
      score: rows[index]?.score ?? 0,
      fives: rows[index]?.fives ?? 0,
      contributions: [],
    })),
  }));

const answerArbitrary: fc.Arbitrary<AnswerValue> = fc.integer({ min: 1, max: 5 });

const questionIndexArbitrary = fc.nat({ max: 12 });

const bookIdArbitrary = fc.constantFrom("book-1", "book-2", "book-3");

/**
 * 한 번에 할 수 있는 UI 동작. 지금 단계에서 틀린 동작도 일부러 섞어,
 * 퍼널이 이벤트 없이 무시하는지 함께 확인한다.
 */
export const funnelActionArbitrary: fc.Arbitrary<FunnelAction> = fc.oneof(
  fc.constant({ type: "start" } as const),
  fc
    .tuple(questionIndexArbitrary, answerArbitrary)
    .map(([questionIndex, answer]): FunnelAction => ({
      type: "answer",
      questionId: questionIdAt(questionIndex),
      answer,
      questionIndex,
    })),
  questionIndexArbitrary.map((questionIndex): FunnelAction => ({
    type: "back",
    questionId: questionIdAt(questionIndex),
  })),
  fc
    .tuple(rankingArbitrary, scoresArbitrary)
    .map(([ranking, scores]): FunnelAction => ({ type: "view_result", ranking, scores })),
  fc
    .tuple(fc.constantFrom(...CODES), fc.constantFrom(...CODES))
    .map(([recommended, handed]): FunnelAction => ({ type: "handover", recommended, handed })),
  bookIdArbitrary.map((bookId): FunnelAction => ({ type: "book_view", bookId })),
  fc
    .tuple(bookIdArbitrary, fc.constantFrom(...CODES))
    .map(([bookId, drawer]): FunnelAction => ({ type: "purchase", bookId, drawer })),
  fc
    .constantFrom("completed", "timeout", "manual")
    .map((reason): FunnelAction => ({ type: "reset", reason })),
);
