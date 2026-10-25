import { describe, expect, it } from "vite-plus/test";

import { drawerOrder, parseQuestionSet } from "../question-set.ts";
import { rank } from "../rank.ts";
import { SEOYUN_ANSWERS, SEOYUN_SET_INPUT } from "../seoyun.fixture.ts";
import { scoreItemMean } from "./item-mean.ts";

describe("item-mean", () => {
  it("서윤이 B6을 가장 높게, B1을 그다음으로 답하면 B6 4.5, B1 3.5, B2 2다", () => {
    expect(scoreItemMean(parseQuestionSet(SEOYUN_SET_INPUT), SEOYUN_ANSWERS)).toStrictEqual({
      scoring: "item-mean",
      drawers: [
        {
          drawer: "B6",
          score: 4.5,
          fives: 1,
          contributions: [
            { question: 0, drawer: "B6", answer: 5, value: 5 },
            { question: 3, drawer: "B6", answer: 4, value: 4 },
          ],
        },
        {
          drawer: "B1",
          score: 3.5,
          fives: 0,
          contributions: [
            { question: 1, drawer: "B1", answer: 4, value: 4 },
            { question: 4, drawer: "B1", answer: 3, value: 3 },
          ],
        },
        {
          drawer: "B2",
          score: 2,
          fives: 0,
          contributions: [{ question: 2, drawer: "B2", answer: 2, value: 2 }],
        },
      ],
    });
  });

  it("서윤의 답은 1순위 B6, 2순위 B1이다", () => {
    const set = parseQuestionSet(SEOYUN_SET_INPUT);

    expect(rank(scoreItemMean(set, SEOYUN_ANSWERS), drawerOrder(set))).toStrictEqual({
      first: "B6",
      second: "B1",
      similar: false,
    });
  });

  it("반대 문항은 6에서 뺀 값으로 계산한다", () => {
    const set = parseQuestionSet({
      drawers: [
        { code: "B6", name: "삶의 방식을 바꾸는 책", order: 0 },
        { code: "B1", name: "나를 들여다보는 책", order: 1 },
      ],
      questions: [
        { type: "item", drawer: "B6", reversed: false, text: "바꾸고 싶다" },
        { type: "item", drawer: "B6", reversed: true, text: "지금 그대로가 좋다" },
        { type: "item", drawer: "B1", reversed: false, text: "나를 들여다본다" },
      ],
      scoring: { type: "item-mean" },
    });

    const scores = scoreItemMean(set, [3, 2, 1]);

    expect(scores.drawers[0]).toStrictEqual({
      drawer: "B6",
      score: 3.5,
      fives: 0,
      contributions: [
        { question: 0, drawer: "B6", answer: 3, value: 3 },
        { question: 1, drawer: "B6", answer: 2, value: 4 },
      ],
    });
  });

  it("문항이 없는 서랍도 점수 0으로 남고 NaN이 없다", () => {
    const set = parseQuestionSet({
      drawers: [
        { code: "B6", name: "삶의 방식을 바꾸는 책", order: 0 },
        { code: "B1", name: "나를 들여다보는 책", order: 1 },
      ],
      questions: [{ type: "item", drawer: "B6", reversed: false, text: "바꾸고 싶다" }],
      scoring: { type: "item-mean" },
    });

    const scores = scoreItemMean(set, [5]);
    const b1 = scores.drawers.find(({ drawer }) => drawer === "B1");

    expect(b1).toStrictEqual({ drawer: "B1", score: 0, fives: 0, contributions: [] });
    expect(scores.drawers.map(({ score }) => score).every(Number.isFinite)).toBe(true);
  });

  it("선택형 질문은 item-mean 점수에 섞지 않는다", () => {
    const set = parseQuestionSet({
      drawers: [
        { code: "B6", name: "삶의 방식을 바꾸는 책", order: 0 },
        { code: "B1", name: "나를 들여다보는 책", order: 1 },
      ],
      questions: [
        { type: "item", drawer: "B6", reversed: false, text: "바꾸고 싶다" },
        {
          type: "choice",
          text: "지금 끌리는 것",
          options: [
            { id: "look", text: "들여다보기", weights: [{ drawer: "B1", weight: 3 }] },
            { id: "change", text: "바꾸기", weights: [{ drawer: "B6", weight: 3 }] },
          ],
        },
      ],
      scoring: { type: "item-mean" },
    });

    const scores = scoreItemMean(set, [4, "look"]);

    expect(scores.drawers.map(({ drawer, score }) => [drawer, score])).toStrictEqual([
      ["B6", 4],
      ["B1", 0],
    ]);
  });
});
