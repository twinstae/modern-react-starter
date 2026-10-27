import type { AnswerValue } from "../answer.ts";
import type { QuestionSet } from "../question-set.ts";
import type { Contribution, DrawerScores } from "./index.ts";
import { answersWithQuestions, drawerScoresFrom, groupContributions } from "./index.ts";

/**
 * 서랍별 문항 평균. 문항이 없는 서랍은 점수 0으로 남는다(증거 없음).
 */
export function scoreItemMean(
  questionSet: QuestionSet,
  answers: readonly AnswerValue[],
): DrawerScores {
  const contributions: Contribution[] = answersWithQuestions(questionSet, answers).map(
    ({ question, answer, index }) => ({
      question: index,
      drawer: question.drawer,
      answer,
      value: answer,
    }),
  );

  return drawerScoresFrom(
    "item-mean",
    questionSet.drawers.map(({ id }) => id),
    groupContributions(contributions),
    (own) => own.reduce((sum, { value }) => sum + value, 0) / own.length,
  );
}
