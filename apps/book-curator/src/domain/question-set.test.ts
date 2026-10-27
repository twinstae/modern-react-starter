import { describe, expect, it } from "vite-plus/test";

import {
  drawerOrder,
  parseQuestionSet,
  questionSetFrom,
  toQuestionSetDto,
} from "./question-set.ts";
import { SEOYUN_SET_INPUT } from "./seoyun.fixture.ts";

describe("질문 세트", () => {
  it("서랍과 문항을 파싱하고, 동점 순서는 서랍 순서다", () => {
    const set = parseQuestionSet(SEOYUN_SET_INPUT);

    expect(drawerOrder(set)).toStrictEqual(["B6", "B1", "B2"]);
    expect(toQuestionSetDto(set)).toStrictEqual(SEOYUN_SET_INPUT);
  });

  it("서랍이 둘 미만이거나 id가 겹치면 거부한다(I-1)", () => {
    expect(() =>
      parseQuestionSet({
        drawers: [{ id: "B6", name: "가" }],
        questions: [{ drawer: "B6", text: "가" }],
      }),
    ).toThrow();
    expect(() =>
      parseQuestionSet({
        drawers: [
          { id: "B6", name: "가" },
          { id: "B6", name: "나" },
        ],
        questions: [{ drawer: "B6", text: "가" }],
      }),
    ).toThrow();
  });

  it("세트에 없는 서랍을 가리키는 문항과 모르는 필드를 거부한다", () => {
    const drawers = [
      { id: "B6", name: "가" },
      { id: "B1", name: "나" },
    ];

    expect(() =>
      parseQuestionSet({ drawers, questions: [{ drawer: "B9", text: "가" }] }),
    ).toThrow();
    expect(() =>
      parseQuestionSet({ drawers, questions: [{ drawer: "B6", text: "가", reversed: true }] }),
    ).toThrow();
  });

  it("서랍들의 문항을 서랍마다 돌아가며 섞어 묻는다", () => {
    const set = questionSetFrom([
      { id: "a", name: "가 서랍", questions: ["가1", "가2", "가3"] },
      { id: "b", name: "나 서랍", questions: ["나1"] },
      { id: "c", name: "다 서랍", questions: ["다1", "다2"] },
    ]);

    expect(set.questions.map(({ text }) => text)).toStrictEqual([
      "가1",
      "나1",
      "다1",
      "가2",
      "다2",
      "가3",
    ]);
    expect(set.drawers).toStrictEqual([
      { id: "a", name: "가 서랍" },
      { id: "b", name: "나 서랍" },
      { id: "c", name: "다 서랍" },
    ]);
  });
});
