import { describe, expect, it } from "vite-plus/test";

import {
  drawerOrder,
  parseQuestionSet,
  parseQuestionSetJson,
  toQuestionSetJson,
} from "./question-set.ts";
import { SEOYUN_SET_INPUT } from "./seoyun.fixture.ts";

describe("QuestionSetSchema", () => {
  it("서랍·문항·채점 방식을 파싱해 도메인 값으로 만든다", () => {
    expect(parseQuestionSet(SEOYUN_SET_INPUT)).toStrictEqual(SEOYUN_SET_INPUT);
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
