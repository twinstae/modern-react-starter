import { InvalidAnswerError, parseAnswer, type AnswerValue } from "./answer.ts";
import type { QuestionSet } from "./question-set.ts";

/**
 * 한 손님의 차례. 진행 상태는 세션 id, 별명, 답 목록이다.
 * 세션 id는 호출하는 쪽이 만들고, 별명과 답은 화면 메모리에만 있다.
 * `endTurn`이 값 자체를 버린다(I-12, I-13).
 */
export interface Turn {
  readonly sessionId: string;
  readonly nickname: string;
  readonly answers: readonly AnswerValue[];
}

/** 별명과 새 세션 id로 차례를 연다. 답은 아직 없다. */
export function startTurn(nickname: string, sessionId: string): Turn {
  return { sessionId, nickname, answers: [] };
}

/**
 * 지금 질문에 답하고 답 목록 뒤에 붙인다. 1~5 정수가 아니거나 이미 다 답했으면
 * `InvalidAnswerError`로 거부한다. 세션 id와 별명은 그대로 남는다.
 */
export function answer(questionSet: QuestionSet, turn: Turn, value: unknown): Turn {
  if (turn.answers.length >= questionSet.questions.length) {
    throw new InvalidAnswerError("모든 질문에 이미 답했습니다");
  }
  return {
    sessionId: turn.sessionId,
    nickname: turn.nickname,
    answers: [...turn.answers, parseAnswer(value)],
  };
}

/** 마지막 답을 버린다. 답이 없으면 그대로다. 세션 id와 별명은 남는다. */
export function back(turn: Turn): Turn {
  return {
    sessionId: turn.sessionId,
    nickname: turn.nickname,
    answers: turn.answers.slice(0, -1),
  };
}

/** 차례를 버린다. 세션 id, 별명, 답이 남지 않는다(I-13). 다음 손님은 새 차례를 연다. */
export function endTurn(): undefined {
  return undefined;
}
