import type { AnswerValue } from "../answer.ts";
import { InvalidAnswerError } from "../answer.ts";
import type { QuestionSet } from "../question-set.ts";
import type { Contribution, DrawerScores } from "./index.ts";
import { answersWithQuestions, drawerScoresFrom, groupContributions } from "./index.ts";

/**
 * 선택형 답의 선택지가 가진 서랍별 가중치를 그대로 더한다(v0.2 호환).
 * 문항형 질문은 이 채점기가 보지 않는다. 가중치가 없는 서랍은 점수 0으로 남는다.
 */
export function scoreChoiceWeight(
  questionSet: QuestionSet,
  answers: readonly AnswerValue[],
): DrawerScores {
  const contributions: Contribution[] = [];

  for (const { question, answer, index } of answersWithQuestions(questionSet, answers)) {
    if (question.type !== "choice" || typeof answer !== "string") continue;

    const option = question.options.find(({ id }) => id === answer);
    if (option === undefined) {
      throw new InvalidAnswerError(`선택지에 없는 답입니다: ${answer}`);
    }

    for (const { drawer, weight } of option.weights) {
      contributions.push({ question: index, drawer, answer, value: weight });
    }
  }

  return drawerScoresFrom(
    "choice-weight",
    questionSet.drawers.map(({ code }) => code),
    groupContributions(contributions),
    (own) => own.reduce((sum, { value }) => sum + value, 0),
  );
}
