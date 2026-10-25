import * as v from "valibot";

import { answerValueFor, InvalidAnswerError, type AnswerValue } from "../answer.ts";
import {
  DrawerCodeSchema,
  type DrawerCode,
  type Question,
  type QuestionSet,
} from "../question-set.ts";

/**
 * 한 답이 한 서랍 점수에 남긴 자리. `value`는 반대 문항을 뒤집은 뒤의 값이다.
 * 인용(I-8)은 `question`과 `answer`로 되짚는다.
 */
export const ContributionSchema = v.strictObject({
  question: v.pipe(v.number(), v.integer(), v.minValue(0)),
  drawer: DrawerCodeSchema,
  answer: v.union([
    v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(5)),
    v.pipe(v.string(), v.minLength(1)),
  ]),
  value: v.number(),
});

export type Contribution = v.InferOutput<typeof ContributionSchema>;

/** 서랍 하나의 점수와, 그 점수에 기여한 답, 동점 규칙에 쓰는 유효한 5의 수. */
export const DrawerScoreSchema = v.strictObject({
  drawer: DrawerCodeSchema,
  score: v.number(),
  fives: v.pipe(v.number(), v.integer(), v.minValue(0)),
  contributions: v.array(ContributionSchema),
});

export type DrawerScore = v.InferOutput<typeof DrawerScoreSchema>;

/** 채점 방식 이름. `learned`는 아직 채점기가 없지만 결과 모양은 받는다(I-6). */
export const ScoringNameSchema = v.picklist(["item-mean", "choice-weight", "learned"]);

export type ScoringName = v.InferOutput<typeof ScoringNameSchema>;

/**
 * 채점 방식이 무엇이든 같은 모양. 순위는 이 값의 점수·5의 수만 본다.
 * 서랍은 둘 이상이고 겹치지 않는다. 문항이 없는 서랍도 점수 0으로 남는다.
 */
export const DrawerScoresSchema = v.pipe(
  v.strictObject({
    scoring: ScoringNameSchema,
    drawers: v.pipe(
      v.array(DrawerScoreSchema),
      v.minLength(2),
      v.check(
        (drawers) => new Set(drawers.map(({ drawer }) => drawer)).size === drawers.length,
        "서랍 점수에 같은 서랍이 두 번 나올 수 없습니다",
      ),
    ),
  }),
);

export type DrawerScores = v.InferOutput<typeof DrawerScoresSchema>;

export function parseDrawerScores(value: unknown): DrawerScores {
  return v.parse(DrawerScoresSchema, value);
}

/** 답 목록을 질문과 짝지어 확인한다. 답이 질문보다 많거나 형식에 맞지 않으면 거부한다. */
export function answersWithQuestions(
  questionSet: QuestionSet,
  answers: readonly AnswerValue[],
): { question: Question; answer: AnswerValue; index: number }[] {
  if (answers.length > questionSet.questions.length) {
    throw new InvalidAnswerError("답이 질문보다 많습니다");
  }

  return answers.map((answer, index) => {
    const question = questionSet.questions[index];
    if (question === undefined) {
      throw new InvalidAnswerError("답에 해당하는 질문이 없습니다");
    }
    return { question, answer: answerValueFor(question, answer), index };
  });
}

/** 문항이 없는 서랍의 점수. 증거가 없으므로 0이고, NaN을 만들지 않는다. */
export const NO_EVIDENCE_SCORE = 0;

/**
 * 기여한 답들을 서랍별 `DrawerScores`로 묶는다. 점수 계산만 채점기가 정한다.
 * 기여가 없는 서랍은 채점기를 부르지 않고 점수 0으로 남긴다(버리지 않는다).
 */
export function drawerScoresFrom(
  scoring: ScoringName,
  drawers: readonly DrawerCode[],
  contributionsByDrawer: ReadonlyMap<DrawerCode, readonly Contribution[]>,
  scoreOf: (contributions: readonly Contribution[]) => number,
): DrawerScores {
  return parseDrawerScores({
    scoring,
    drawers: drawers.map((drawer) => {
      const own = contributionsByDrawer.get(drawer) ?? [];
      return {
        drawer,
        score: own.length === 0 ? NO_EVIDENCE_SCORE : scoreOf(own),
        fives: own.filter(({ value }) => value === 5).length,
        contributions: own,
      };
    }),
  });
}

/** 기여를 서랍별로 모은다. 답 순서를 그대로 지켜 결정적으로 만든다. */
export function groupContributions(
  contributions: readonly Contribution[],
): Map<DrawerCode, Contribution[]> {
  const grouped = new Map<DrawerCode, Contribution[]>();
  for (const contribution of contributions) {
    const own = grouped.get(contribution.drawer);
    if (own === undefined) grouped.set(contribution.drawer, [contribution]);
    else own.push(contribution);
  }
  return grouped;
}
