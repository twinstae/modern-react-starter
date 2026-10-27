import * as v from "valibot";

/** 답 하나. 1(전혀 아니다)~5(매우 그렇다). */
export const AnswerValueSchema = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(5));

export type AnswerValue = v.InferOutput<typeof AnswerValueSchema>;

/** 답이 1~5 정수가 아닐 때 던지는 이름 있는 오류. */
export class InvalidAnswerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAnswerError";
  }
}

/** 1~5 정수인지 확인하고, 맞으면 그대로 돌려준다. */
export function parseAnswer(value: unknown): AnswerValue {
  const parsed = v.safeParse(AnswerValueSchema, value);
  if (!parsed.success) throw new InvalidAnswerError("문항에는 1~5 사이 정수로 답해야 합니다");
  return parsed.output;
}
