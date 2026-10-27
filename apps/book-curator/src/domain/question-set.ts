import * as v from "valibot";

import type { Drawer } from "./drawer.ts";

const unique = <T>(values: readonly T[]): boolean => new Set(values).size === values.length;

export const TextSchema = v.pipe(v.string(), v.trim(), v.minLength(1));

/** 서랍 id. 질문과 서가가 서랍을 가리키는 값이고 이용자에게는 보이지 않는다. */
export const DrawerIdSchema = TextSchema;

export type DrawerId = v.InferOutput<typeof DrawerIdSchema>;

/** 질문 세트 안의 서랍. 순서는 배열 순서이고, 동점이 끝까지 갈 때만 쓰인다. */
export const QuestionSetDrawerSchema = v.strictObject({
  id: DrawerIdSchema,
  name: TextSchema,
});

export type QuestionSetDrawer = v.InferOutput<typeof QuestionSetDrawerSchema>;

/** 문항. 한 서랍에 속하고 손님은 1(전혀 아니다)~5(매우 그렇다)로 답한다. */
export const QuestionSchema = v.strictObject({
  drawer: DrawerIdSchema,
  text: TextSchema,
});

export type Question = v.InferOutput<typeof QuestionSchema>;

/**
 * 손님에게 묻는 질문 세트. 서랍들의 문항을 모은 것이다.
 *
 * - 서랍은 둘 이상이고 id가 겹치지 않는다. 그래야 1·2순위가 서로 다른 서랍이다(I-1).
 * - 문항이 가리키는 서랍은 세트에 있어야 한다.
 */
export const QuestionSetSchema = v.pipe(
  v.strictObject({
    drawers: v.pipe(
      v.array(QuestionSetDrawerSchema),
      v.minLength(2),
      v.check((drawers) => unique(drawers.map(({ id }) => id)), "서랍 id는 겹치지 않아야 합니다"),
    ),
    questions: v.pipe(v.array(QuestionSchema), v.minLength(1)),
  }),
  v.check((set) => {
    const ids = new Set(set.drawers.map(({ id }) => id));
    return set.questions.every(({ drawer }) => ids.has(drawer));
  }, "문항이 세트에 없는 서랍을 가리킵니다"),
);

export type QuestionSet = v.InferOutput<typeof QuestionSetSchema>;

export function parseQuestionSet(value: unknown): QuestionSet {
  return v.parse(QuestionSetSchema, value);
}

/** 동점이 끝까지 갈 때 쓰는 서랍 순서. 운영 화면에 보이는 서랍 순서와 같다. */
export function drawerOrder(set: QuestionSet): DrawerId[] {
  return set.drawers.map(({ id }) => id);
}

/**
 * 서랍들의 문항으로 질문 세트를 만든다. 한 서랍의 문항이 몰리지 않게 서랍마다 첫 문항,
 * 그다음 둘째 문항 … 순서로 섞는다. 공개 때 한 번 만들어 버전에 저장하므로, 이미
 * 공개한 버전의 문항 순서는 바뀌지 않는다(I-11).
 */
export function questionSetFrom(drawers: readonly Pick<Drawer, "id" | "name" | "questions">[]) {
  const rounds = Math.max(0, ...drawers.map(({ questions }) => questions.length));
  const questions: Question[] = [];
  for (let round = 0; round < rounds; round += 1) {
    for (const drawer of drawers) {
      const text = drawer.questions[round];
      if (text !== undefined) questions.push({ drawer: drawer.id, text });
    }
  }
  return parseQuestionSet({
    drawers: drawers.map(({ id, name }) => ({ id, name })),
    questions,
  });
}

/** 도메인 값을 화면·저장소와 주고받을 평범한 객체로 옮긴다. */
export function toQuestionSetDto(set: QuestionSet): QuestionSet {
  return {
    drawers: set.drawers.map(({ id, name }) => ({ id, name })),
    questions: set.questions.map(({ drawer, text }) => ({ drawer, text })),
  };
}
