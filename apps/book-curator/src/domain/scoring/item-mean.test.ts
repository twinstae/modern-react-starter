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

  it("문항이 없는 서랍도 점수 0으로 남고 NaN이 없다", () => {
    const set = parseQuestionSet({
      drawers: [
        { id: "B6", name: "삶의 방식을 바꾸는 책" },
        { id: "B1", name: "나를 들여다보는 책" },
      ],
      questions: [{ drawer: "B6", text: "바꾸고 싶다" }],
    });

    const scores = scoreItemMean(set, [5]);
    const b1 = scores.drawers.find(({ drawer }) => drawer === "B1");

    expect(b1).toStrictEqual({ drawer: "B1", score: 0, fives: 0, contributions: [] });
    expect(scores.drawers.map(({ score }) => score).every(Number.isFinite)).toBe(true);
  });
});
