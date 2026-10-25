import type { AnswerValue } from "../answer.ts";
import type { QuestionSet } from "../question-set.ts";
import type { Contribution, DrawerScores } from "./index.ts";
import { answersWithQuestions, drawerScoresFrom, groupContributions } from "./index.ts";

/** 반대 문항을 뒤집는 값. 1~5 척도라 6에서 뺀다. */
const REVERSED_BASE = 6;

/**
 * 서랍별 문항 평균. 반대 문항은 6에서 뺀 값으로 계산한다.
 * 선택형 질문은 이 채점기가 보지 않는다(형식과 채점 방식은 따로다).
 * 문항이 없는 서랍은 점수 0으로 남는다(증거 없음).
 */
export function scoreItemMean(
  questionSet: QuestionSet,
  answers: readonly AnswerValue[],
): DrawerScores {
  const contributions: Contribution[] = [];

  for (const { question, answer, index } of answersWithQuestions(questionSet, answers)) {
    if (question.type !== "item" || typeof answer !== "number") continue;
    contributions.push({
      question: index,
      drawer: question.drawer,
      answer,
      value: question.reversed ? REVERSED_BASE - answer : answer,
    });
  }

  return drawerScoresFrom(
    "item-mean",
    questionSet.drawers.map(({ code }) => code),
    groupContributions(contributions),
    (own) => own.reduce((sum, { value }) => sum + value, 0) / own.length,
  );
}
