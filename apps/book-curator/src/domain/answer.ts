import * as v from "valibot";

import type { Question } from "./question-set.ts";

/** 문항형 답. 1(전혀 아니다)~5(매우 그렇다). */
export const ItemAnswerSchema = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(5));

/** 답 하나. 문항형이면 1~5, 선택형이면 선택지 id다. */
export const AnswerValueSchema = v.union([ItemAnswerSchema, v.pipe(v.string(), v.minLength(1))]);

export type AnswerValue = v.InferOutput<typeof AnswerValueSchema>;

/** 답이 질문 형식에 맞지 않을 때 던지는 이름 있는 오류. */
export class InvalidAnswerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAnswerError";
  }
}

/**
 * 질문 형식에 맞는 답인지 확인하고, 맞으면 그대로 돌려준다.
 * 답이 질문의 선택지에 없거나 1~5 밖이면 `InvalidAnswerError`를 던진다.
 */
export function answerValueFor(question: Question, value: unknown): AnswerValue {
  if (question.type === "item") {
    const parsed = v.safeParse(ItemAnswerSchema, value);
    if (!parsed.success) {
      throw new InvalidAnswerError("문항형 질문에는 1~5 사이 정수로 답해야 합니다");
    }
    return parsed.output;
  }

  if (typeof value !== "string" || !question.options.some(({ id }) => id === value)) {
    throw new InvalidAnswerError(`선택지에 없는 답입니다: ${String(value)}`);
  }
  return value;
}
