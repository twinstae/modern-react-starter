import { answerValueFor, InvalidAnswerError, type AnswerValue } from "./answer.ts";
import type { QuestionSet } from "./question-set.ts";

/**
 * 한 손님의 차례. 진행 상태는 답 목록 하나와 별명이다.
 * 별명은 화면 메모리에만 있고, `endTurn`이 값 자체를 버린다(I-12, I-13).
 */
export interface Turn {
  readonly nickname: string;
  readonly answers: readonly AnswerValue[];
}

/** 별명으로 차례를 연다. 답은 아직 없다. */
export function startTurn(nickname: string): Turn {
  return { nickname, answers: [] };
}

/**
 * 지금 질문에 답하고 답 목록 뒤에 붙인다. 질문 형식에 맞지 않는 값은
 * `InvalidAnswerError`로 거부한다. 별명은 그대로 남는다.
 */
export function answer(questionSet: QuestionSet, turn: Turn, value: unknown): Turn {
  const question = questionSet.questions[turn.answers.length];
  if (question === undefined) {
    throw new InvalidAnswerError("모든 질문에 이미 답했습니다");
  }
  return {
    nickname: turn.nickname,
    answers: [...turn.answers, answerValueFor(question, value)],
  };
}

/** 마지막 답을 버린다. 답이 없으면 그대로다. 별명은 남는다. */
export function back(turn: Turn): Turn {
  return { nickname: turn.nickname, answers: turn.answers.slice(0, -1) };
}

/** 차례를 버린다. 별명과 답이 남지 않는다(I-13). 다음 손님은 새 차례를 연다. */
export function endTurn(): undefined {
  return undefined;
}
