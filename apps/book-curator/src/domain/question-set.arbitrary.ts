import fc from "fast-check";

import type { AnswerValue } from "./answer.ts";
import {
  parseQuestionSet,
  type DrawerId,
  type Question,
  type QuestionSet,
  type QuestionSetDrawer,
} from "./question-set.ts";

const IDS = ["B1", "B2", "B3", "B4", "B5", "B6", "B7"] as const;

const NAMES: Record<(typeof IDS)[number], string> = {
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

/** 서랍 수(2~7)와 순서가 무작위인 서랍. */
const drawersArbitrary: fc.Arbitrary<QuestionSetDrawer[]> = fc
  .integer({ min: 2, max: IDS.length })
  .chain((count) => fc.shuffledSubarray([...IDS], { minLength: count, maxLength: count }))
  .map((ids) => ids.map((id) => ({ id, name: NAMES[id] })));

const questionArbitrary = (ids: readonly DrawerId[]): fc.Arbitrary<Question> =>
  fc.record({ drawer: fc.constantFrom(...ids), text: fc.constantFrom(...TEXTS) });

/**
 * 서랍 수·문항 수가 모두 무작위인 질문 세트. 통과한 값만 돌려주므로 속성 테스트가
 * 곧 스키마 검사다(I-1, I-5).
 */
export const questionSetArbitrary: fc.Arbitrary<QuestionSet> = drawersArbitrary.chain((drawers) =>
  fc
    .array(questionArbitrary(drawers.map(({ id }) => id)), { minLength: 1, maxLength: 12 })
    .map((questions) => parseQuestionSet({ drawers, questions })),
);

/** 질문마다 1~5 답 하나. 길이는 질문 수와 같다. */
export function answersArbitrary(questionSet: QuestionSet): fc.Arbitrary<AnswerValue[]> {
  return fc.array(fc.integer({ min: 1, max: 5 }), {
    minLength: questionSet.questions.length,
    maxLength: questionSet.questions.length,
  });
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
 * 모든 서랍에 문항을 하나 이상 둔 질문 세트. 어떤 답을 하든 각 서랍에 긍정 기여가
 * 남으므로 인용(I-8) 속성을 항상 확인할 수 있다.
 */
export const curatableQuestionSetArbitrary: fc.Arbitrary<QuestionSet> = drawersArbitrary.chain(
  (drawers) => {
    const ids = drawers.map(({ id }) => id);
    const anchors = ids.map((id) => ({ drawer: id, text: "지금 이 서랍이 필요하다" }));

    return fc.array(questionArbitrary(ids), { maxLength: 5 }).map((questions) =>
      parseQuestionSet({
        drawers,
        questions: [...anchors, ...questions],
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
