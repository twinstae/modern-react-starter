import fc from "fast-check";

import type { AnswerValue } from "./answer.ts";
import {
  parseQuestionSet,
  type ChoiceQuestion,
  type Drawer,
  type DrawerCode,
  type DrawerWeight,
  type ItemQuestion,
  type Question,
  type QuestionSet,
} from "./question-set.ts";

const CODES = ["B1", "B2", "B3", "B4", "B5", "B6", "B7"] as const satisfies readonly DrawerCode[];

const NAMES: Record<DrawerCode, string> = {
  B1: "나를 들여다보는 책",
  B2: "관계를 다시 생각하는 책",
  B3: "다른 삶을 만나는 책",
  B4: "사회를 이해하는 책",
  B5: "세계를 넓혀 보는 책",
  B6: "삶의 방식을 바꾸는 책",
  B7: "잠시 멈춰 생각하는 책",
};

const TEXTS = [
  "요즘 생활에서 무언가를 바꾸고 싶다",
  "나는 어떤 사람인지 자주 생각한다",
  "요즘 사람들과의 거리가 고민이다",
  "지금 끌리는 것",
  "책을 읽는 이유",
] as const;

/** 서랍 수(2~7)와 관리자 순서가 무작위인 서랍 정의. */
const drawersArbitrary: fc.Arbitrary<Drawer[]> = fc
  .integer({ min: 2, max: CODES.length })
  .chain((count) =>
    fc
      .tuple(
        fc.shuffledSubarray([...CODES], { minLength: count, maxLength: count }),
        fc.shuffledSubarray(
          Array.from({ length: count }, (_, index) => index),
          { minLength: count, maxLength: count },
        ),
      )
      .map(([codes, orders]) =>
        codes.map((code, index) => ({
          code,
          name: NAMES[code],
          order: orders[index],
          statement: null,
          mark: null,
          reason: null,
          keywords: [],
        })),
      ),
  );

/** 한 선택지의 서랍 가중치. 서랍은 겹치지 않고, 비어 있을 수도 있다. */
const weightsArbitrary = (codes: readonly DrawerCode[]): fc.Arbitrary<DrawerWeight[]> =>
  fc
    .array(fc.tuple(fc.constantFrom(...codes), fc.integer({ min: -2, max: 5 })), {
      maxLength: codes.length,
    })
    .map((pairs) => {
      const seen = new Set<DrawerCode>();
      const weights: DrawerWeight[] = [];
      for (const [drawer, weight] of pairs) {
        if (seen.has(drawer)) continue;
        seen.add(drawer);
        weights.push({ drawer, weight });
      }
      return weights;
    });

const itemQuestionArbitrary = (codes: readonly DrawerCode[]): fc.Arbitrary<ItemQuestion> =>
  fc
    .record({
      drawer: fc.constantFrom(...codes),
      reversed: fc.boolean(),
      text: fc.constantFrom(...TEXTS),
    })
    .map(({ drawer, reversed, text }) => ({ type: "item", drawer, reversed, text }));

const choiceQuestionArbitrary = (codes: readonly DrawerCode[]): fc.Arbitrary<ChoiceQuestion> =>
  fc
    .array(
      fc.record({
        text: fc.constantFrom(...TEXTS),
        weights: weightsArbitrary(codes),
      }),
      { minLength: 2, maxLength: 4 },
    )
    .map((options) => ({
      type: "choice",
      text: "지금 끌리는 것",
      options: options.map(({ text, weights }, index) => ({ id: `o${index + 1}`, text, weights })),
    }));

const questionArbitrary = (codes: readonly DrawerCode[]): fc.Arbitrary<Question> =>
  fc.oneof(itemQuestionArbitrary(codes), choiceQuestionArbitrary(codes));

/**
 * 서랍 수·문항 수·형식이 모두 무작위인 질문 세트. 형식과 채점 방식도 따로 고른다.
 * 통과한 값만 돌려주므로 속성 테스트가 곧 스키마 검사다(I-1, I-5).
 */
export const questionSetArbitrary: fc.Arbitrary<QuestionSet> = drawersArbitrary.chain((drawers) => {
  const codes = drawers.map(({ code }) => code);
  return fc
    .tuple(
      fc.array(questionArbitrary(codes), { minLength: 1, maxLength: 12 }),
      fc.constantFrom("item-mean" as const, "choice-weight" as const),
    )
    .map(([questions, scoring]) =>
      parseQuestionSet({ drawers, questions, scoring: { type: scoring } }),
    );
});

const answerArbitrary = (question: Question): fc.Arbitrary<AnswerValue> =>
  question.type === "item"
    ? fc.integer({ min: 1, max: 5 })
    : fc.constantFrom(...question.options.map(({ id }) => id));

/** 질문마다 형식에 맞는 답 하나. 길이는 질문 수와 같다. */
export function answersArbitrary(questionSet: QuestionSet): fc.Arbitrary<AnswerValue[]> {
  return fc.tuple(...questionSet.questions.map(answerArbitrary)).map((answers) => answers);
}

/** 손님이 한 번에 하는 일. 답하기 또는 되돌아가기. */
export type Interaction =
  | { readonly type: "answer"; readonly value: AnswerValue }
  | { readonly type: "back" };

/**
 * 답하기·되돌아가기 무작위열. 답은 그 순간의 질문에 맞는 값만 고르므로
 * 어떤 열이든 실제 차례에 그대로 적용할 수 있다.
 */
export function interactionArbitrary(questionSet: QuestionSet): fc.Arbitrary<Interaction[]> {
  return fc
    .tuple(
      answersArbitrary(questionSet),
      fc.array(fc.boolean(), { maxLength: questionSet.questions.length * 2 + 2 }),
    )
    .map(([answers, moves]) => {
      const interactions: Interaction[] = [];
      let answered = 0;
      for (const move of moves) {
        if (move && answered < answers.length) {
          interactions.push({ type: "answer", value: answers[answered] });
          answered += 1;
        } else {
          interactions.push({ type: "back" });
          answered = Math.max(0, answered - 1);
        }
      }
      return interactions;
    });
}

/** 질문 세트와 그 안의 완전한 답 목록. */
export const answeredQuestionSetArbitrary = questionSetArbitrary.chain((questionSet) =>
  answersArbitrary(questionSet).map((answers) => ({ questionSet, answers })),
);

/**
 * 모든 서랍에 문항형 질문을 하나 이상 둔 질문 세트. 어떤 답을 하든 각 서랍에
 * 긍정 기여가 남으므로 인용(I-8) 속성을 항상 확인할 수 있다.
 */
export const curatableQuestionSetArbitrary: fc.Arbitrary<QuestionSet> = drawersArbitrary.chain(
  (drawers) => {
    const codes = drawers.map(({ code }) => code);
    const anchors = drawers.map(({ code }) => ({
      type: "item" as const,
      drawer: code,
      reversed: false,
      text: "지금 이 서랍이 필요하다",
    }));

    return fc.array(questionArbitrary(codes), { maxLength: 5 }).map((questions) =>
      parseQuestionSet({
        drawers,
        questions: [...anchors, ...questions],
        scoring: { type: "item-mean" },
      }),
    );
  },
);

/** 큐레이션 가능한 질문 세트와 그 안의 완전한 답 목록. */
export const curatableAnsweredQuestionSetArbitrary = curatableQuestionSetArbitrary.chain(
  (questionSet) => answersArbitrary(questionSet).map((answers) => ({ questionSet, answers })),
);

/** 질문 세트와 그 안에서 할 수 있는 상호작용열. */
export const interactionSequenceArbitrary = questionSetArbitrary.chain((questionSet) =>
  interactionArbitrary(questionSet).map((interactions) => ({ questionSet, interactions })),
);
