import * as v from "valibot";

/** 서랍 코드. 질문 세트와 서가가 서로를 가리키는 유일한 값이고 이용자에게는 보이지 않는다. */
export const DrawerCodeSchema = v.picklist(["B1", "B2", "B3", "B4", "B5", "B6", "B7"]);

export type DrawerCode = v.InferOutput<typeof DrawerCodeSchema>;

const unique = <T>(values: readonly T[]): boolean => new Set(values).size === values.length;

const TextSchema = v.pipe(v.string(), v.trim(), v.minLength(1));

/**
 * 서랍 정의. `order`는 관리자가 정한 순서이고, 동점이 끝까지 갈 때만 쓰인다.
 * 서랍 수는 데이터다. 코드가 B1~B7이어도 질문 세트가 2개만 가질 수 있다.
 */
export const DrawerSchema = v.strictObject({
  code: DrawerCodeSchema,
  name: TextSchema,
  order: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

export type Drawer = v.InferOutput<typeof DrawerSchema>;

/** 선택지가 특정 서랍에 주는 가중치. */
export const DrawerWeightSchema = v.strictObject({
  drawer: DrawerCodeSchema,
  weight: v.number(),
});

export type DrawerWeight = v.InferOutput<typeof DrawerWeightSchema>;

/** 선택형 질문의 선택지. 가중치가 비어 있으면 어느 서랍에도 기여하지 않는다. */
export const ChoiceOptionSchema = v.strictObject({
  id: TextSchema,
  text: TextSchema,
  weights: v.array(DrawerWeightSchema),
});

export type ChoiceOption = v.InferOutput<typeof ChoiceOptionSchema>;

/** 문항형: 한 서랍에 속하고, 반대로 읽을 수 있다. */
const ItemQuestionSchema = v.strictObject({
  type: v.literal("item"),
  drawer: DrawerCodeSchema,
  reversed: v.boolean(),
  text: TextSchema,
});

export type ItemQuestion = v.InferOutput<typeof ItemQuestionSchema>;

/** 선택형: 선택지마다 서랍별 가중치를 가진다. */
const ChoiceQuestionSchema = v.strictObject({
  type: v.literal("choice"),
  text: TextSchema,
  options: v.pipe(
    v.array(ChoiceOptionSchema),
    v.minLength(2),
    v.check((options) => unique(options.map(({ id }) => id)), "선택지 id는 겹치지 않아야 합니다"),
    v.check(
      (options) => options.every(({ weights }) => unique(weights.map(({ drawer }) => drawer))),
      "한 선택지에 같은 서랍 가중치를 두 번 둘 수 없습니다",
    ),
  ),
});

export type ChoiceQuestion = v.InferOutput<typeof ChoiceQuestionSchema>;

export const QuestionSchema = v.variant("type", [ItemQuestionSchema, ChoiceQuestionSchema]);

export type Question = v.InferOutput<typeof QuestionSchema>;

/** 답을 서랍 점수로 바꾸는 방법. `learned`는 TICKET-00013에서 더한다. */
export const ScoringSchema = v.variant("type", [
  v.strictObject({ type: v.literal("item-mean") }),
  v.strictObject({ type: v.literal("choice-weight") }),
]);

export type Scoring = v.InferOutput<typeof ScoringSchema>;

const drawerCodes = (drawers: readonly Drawer[]) => new Set(drawers.map(({ code }) => code));

/**
 * 질문 세트. 파싱에 성공한 값만 도메인 안으로 들어온다.
 *
 * - 서랍은 둘 이상이고 코드와 순서가 겹치지 않는다. 그래야 어떤 답 목록에도 1·2순위가
 *   서로 다른 서랍으로 정해진다(I-1).
 * - 질문이 가리키는 서랍은 정의에 있어야 한다. 점수가 붙을 곳 없는 답을 만들지 않는다.
 * - 질문 수와 형식은 데이터가 정한다(I-5).
 */
export const QuestionSetSchema = v.pipe(
  v.strictObject({
    drawers: v.pipe(
      v.array(DrawerSchema),
      v.minLength(2),
      v.check(
        (drawers) => unique(drawers.map(({ code }) => code)),
        "서랍 코드는 겹치지 않아야 합니다",
      ),
      v.check(
        (drawers) => unique(drawers.map(({ order }) => order)),
        "서랍 순서는 겹치지 않아야 합니다",
      ),
    ),
    questions: v.pipe(v.array(QuestionSchema), v.minLength(1)),
    scoring: ScoringSchema,
  }),
  v.check((set) => {
    const codes = drawerCodes(set.drawers);
    return set.questions.every((question) =>
      question.type === "item"
        ? codes.has(question.drawer)
        : question.options.every(({ weights }) => weights.every(({ drawer }) => codes.has(drawer))),
    );
  }, "질문이 정의에 없는 서랍을 가리킵니다"),
);

export type QuestionSet = v.InferOutput<typeof QuestionSetSchema>;

/** 질문 세트 JSON의 모양. 직렬화는 이 모양으로만 옮긴다. */
export type QuestionSetDto = v.InferOutput<typeof QuestionSetSchema>;

export function parseQuestionSet(value: unknown): QuestionSet {
  return v.parse(QuestionSetSchema, value);
}

/** 관리자가 정한 서랍 순서. 동점이 끝까지 갈 때 rank가 쓴다. */
export function drawerOrder(set: QuestionSet): DrawerCode[] {
  return [...set.drawers].sort((a, b) => a.order - b.order).map(({ code }) => code);
}

/** 도메인 값을 화면·저장소와 주고받을 평범한 객체로 옮긴다. */
export function toQuestionSetDto(set: QuestionSet): QuestionSetDto {
  return {
    drawers: set.drawers.map(({ code, name, order }) => ({ code, name, order })),
    questions: set.questions.map((question) =>
      question.type === "item"
        ? {
            type: "item",
            drawer: question.drawer,
            reversed: question.reversed,
            text: question.text,
          }
        : {
            type: "choice",
            text: question.text,
            options: question.options.map(({ id, text, weights }) => ({
              id,
              text,
              weights: weights.map(({ drawer, weight }) => ({ drawer, weight })),
            })),
          },
    ),
    scoring: { type: set.scoring.type },
  };
}

export function toQuestionSetJson(set: QuestionSet): string {
  return JSON.stringify(toQuestionSetDto(set));
}

export function parseQuestionSetJson(json: string): QuestionSet {
  return parseQuestionSet(JSON.parse(json));
}
