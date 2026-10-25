import { describe, expect, it } from "vite-plus/test";

import {
  drawerOrder,
  parseQuestionSet,
  parseQuestionSetJson,
  toQuestionSetJson,
} from "./question-set.ts";
import { SEOYUN_SET_INPUT } from "./seoyun.fixture.ts";
import {
  DEFAULT_CITATION_TEMPLATES,
  DEFAULT_STATEMENT_TEMPLATE,
  UnknownJosaError,
  UnknownPlaceholderError,
} from "./statement.ts";

const withDefaults = (input: typeof SEOYUN_SET_INPUT) => ({
  ...input,
  drawers: input.drawers.map((drawer) => ({
    ...drawer,
    statement: null,
    mark: null,
    reason: null,
  })),
  statementTemplate: DEFAULT_STATEMENT_TEMPLATE,
  citationTemplates: DEFAULT_CITATION_TEMPLATES,
});

describe("QuestionSetSchema", () => {
  it("서랍·문항·채점 방식을 파싱해 도메인 값으로 만든다", () => {
    expect(parseQuestionSet(SEOYUN_SET_INPUT)).toStrictEqual(withDefaults(SEOYUN_SET_INPUT));
  });

  it("관리자가 정한 서랍 순서를 돌려준다", () => {
    expect(drawerOrder(parseQuestionSet(SEOYUN_SET_INPUT))).toStrictEqual(["B6", "B1", "B2"]);
  });

  it("서랍이 둘 미만이면 거부한다(I-1)", () => {
    const input = {
      ...SEOYUN_SET_INPUT,
      drawers: [{ code: "B6", name: "삶의 방식을 바꾸는 책", order: 0 }],
      questions: [SEOYUN_SET_INPUT.questions[0]],
    };

    expect(() => parseQuestionSet(input)).toThrow();
  });

  it("서랍 코드와 순서가 겹치면 거부한다", () => {
    expect(() =>
      parseQuestionSet({
        ...SEOYUN_SET_INPUT,
        drawers: [
          { code: "B6", name: "삶의 방식을 바꾸는 책", order: 0 },
          { code: "B6", name: "다른 이름", order: 1 },
        ],
      }),
    ).toThrow();

    expect(() =>
      parseQuestionSet({
        ...SEOYUN_SET_INPUT,
        drawers: [
          { code: "B6", name: "삶의 방식을 바꾸는 책", order: 0 },
          { code: "B1", name: "나를 들여다보는 책", order: 0 },
        ],
      }),
    ).toThrow();
  });

  it("정의에 없는 서랍을 가리키는 문항과 가중치를 거부한다", () => {
    expect(() =>
      parseQuestionSet({
        ...SEOYUN_SET_INPUT,
        questions: [{ type: "item", drawer: "B7", reversed: false, text: "정의에 없는 서랍" }],
      }),
    ).toThrow();

    expect(() =>
      parseQuestionSet({
        ...SEOYUN_SET_INPUT,
        questions: [
          {
            type: "choice",
            text: "지금 끌리는 것",
            options: [
              { id: "a", text: "가", weights: [{ drawer: "B7", weight: 2 }] },
              { id: "b", text: "나", weights: [] },
            ],
          },
        ],
      }),
    ).toThrow();
  });

  it("서랍 표시와 권하는 이유를 담고, 없으면 null로 정규화해 왕복한다", () => {
    const input = {
      ...SEOYUN_SET_INPUT,
      drawers: SEOYUN_SET_INPUT.drawers.map((drawer, index) =>
        index === 0
          ? {
              ...drawer,
              mark: "[가정] 1번 · 열쇠 1",
              reason: "[가정] 그 마음이 이 서랍으로 이어집니다",
            }
          : drawer,
      ),
    };
    const set = parseQuestionSet(input);

    expect(set.drawers.map(({ mark }) => mark)).toStrictEqual(["[가정] 1번 · 열쇠 1", null, null]);
    expect(set.drawers.map(({ reason }) => reason)).toStrictEqual([
      "[가정] 그 마음이 이 서랍으로 이어집니다",
      null,
      null,
    ]);
    expect(parseQuestionSetJson(toQuestionSetJson(set))).toStrictEqual(set);
  });

  it("모르는 필드를 거부한다", () => {
    expect(() => parseQuestionSet({ ...SEOYUN_SET_INPUT, draft: true })).toThrow();
    expect(() =>
      parseQuestionSet({
        ...SEOYUN_SET_INPUT,
        questions: [{ ...SEOYUN_SET_INPUT.questions[0], points: 3 }],
      }),
    ).toThrow();
  });

  it("JSON 직렬화 왕복에도 같은 질문 세트다", () => {
    const set = parseQuestionSet(SEOYUN_SET_INPUT);

    expect(parseQuestionSetJson(toQuestionSetJson(set))).toStrictEqual(set);
  });
});

describe("BaselineAnswersSchema", () => {
  const input = {
    ...SEOYUN_SET_INPUT,
    baselines: [
      {
        name: "서윤",
        answers: [5, 4, 2, 4, 3],
        expected: { first: "B6", second: "B1" },
      },
    ],
  };

  it("질문 세트와 함께 기준 응답을 파싱하고 왕복한다", () => {
    const set = parseQuestionSet(input);

    expect(set.baselines).toStrictEqual(input.baselines);
    expect(parseQuestionSetJson(toQuestionSetJson(set))).toStrictEqual(set);
  });

  it("기준 응답이 모든 질문에 답하지 않으면 거부한다", () => {
    expect(() =>
      parseQuestionSet({
        ...input,
        baselines: [{ ...input.baselines[0], answers: [5, 4, 2, 4] }],
      }),
    ).toThrow();
  });

  it("기준 응답이 질문 형식에 맞지 않으면 거부한다", () => {
    expect(() =>
      parseQuestionSet({
        ...input,
        baselines: [{ ...input.baselines[0], answers: [6, 4, 2, 4, 3] }],
      }),
    ).toThrow();
  });

  it("기준 응답의 기대 순위가 정의 밖이거나 같은 서랍이면 거부한다", () => {
    expect(() =>
      parseQuestionSet({
        ...input,
        baselines: [{ ...input.baselines[0], expected: { first: "B7", second: "B1" } }],
      }),
    ).toThrow();

    expect(() =>
      parseQuestionSet({
        ...input,
        baselines: [{ ...input.baselines[0], expected: { first: "B6", second: "B6" } }],
      }),
    ).toThrow();
  });

  it("기준 응답의 모르는 필드를 거부한다", () => {
    expect(() =>
      parseQuestionSet({
        ...input,
        baselines: [{ ...input.baselines[0], note: "가정" }],
      }),
    ).toThrow();
  });
});

describe("문장 템플릿", () => {
  const input = {
    ...SEOYUN_SET_INPUT,
    statementTemplate: "{nickname} 님에게는 지금 {drawer:이/가} 필요한 상태입니다",
    citationTemplates: {
      item: "‘{quote}’에 그렇다고 답하신",
      choice: "‘{quote}’를 고르신",
    },
    drawers: [
      {
        code: "B6",
        name: "삶의 방식을 바꾸는 책",
        order: 0,
        statement: "삶을 바꾸고 싶은 {nickname} 님에게 {drawer:이/가} 있습니다",
      },
      { code: "B1", name: "나를 들여다보는 책", order: 1, statement: null },
      { code: "B2", name: "관계를 다시 생각하는 책", order: 2, statement: null },
    ],
  } as const;

  it("빠진 문장 템플릿은 기본값으로 채워 한 가지 모양으로 만든다", () => {
    const set = parseQuestionSet(SEOYUN_SET_INPUT);

    expect(set.statementTemplate).toBe(DEFAULT_STATEMENT_TEMPLATE);
    expect(set.citationTemplates).toStrictEqual(DEFAULT_CITATION_TEMPLATES);
    expect(set.drawers.map(({ statement }) => statement)).toStrictEqual([null, null, null]);
  });

  it("공통·서랍별·인용 문형을 담고 JSON으로 왕복한다", () => {
    const set = parseQuestionSet(input);

    expect(set.drawers[0].statement).toBe(input.drawers[0].statement);
    expect(set.drawers[1].statement).toBeNull();
    expect(parseQuestionSetJson(toQuestionSetJson(set))).toStrictEqual(set);
  });

  it("공통 템플릿과 서랍별 문장의 모르는 자리표시를 거부한다", () => {
    expect(() =>
      parseQuestionSet({ ...input, statementTemplate: "{nickname} 님에게 {shelf}" }),
    ).toThrow(UnknownPlaceholderError);

    expect(() =>
      parseQuestionSet({
        ...input,
        drawers: [
          { ...input.drawers[0], statement: "{drawer:이/가} {mood}" },
          input.drawers[1],
          input.drawers[2],
        ],
      }),
    ).toThrow(UnknownPlaceholderError);
  });

  it("모르는 조사가 든 템플릿을 거부한다", () => {
    expect(() => parseQuestionSet({ ...input, statementTemplate: "{drawer:이/가/는}" })).toThrow(
      UnknownJosaError,
    );
  });

  it("인용 문형의 모르는 자리표시를 거부한다", () => {
    expect(() =>
      parseQuestionSet({
        ...input,
        citationTemplates: { ...input.citationTemplates, item: "‘{quote}’ {drawer}" },
      }),
    ).toThrow(UnknownPlaceholderError);
  });

  it("빈 문장 템플릿과 서랍별 문장은 거부한다", () => {
    expect(() => parseQuestionSet({ ...input, statementTemplate: "   " })).toThrow();
    expect(() =>
      parseQuestionSet({
        ...input,
        drawers: [{ ...input.drawers[0], statement: "  " }, input.drawers[1], input.drawers[2]],
      }),
    ).toThrow();
  });
});
