import { describe, expect, it } from "vite-plus/test";

import { parseQuestionSet } from "../question-set.ts";
import { scoreChoiceWeight } from "./choice-weight.ts";

const SET = parseQuestionSet({
  drawers: [
    { code: "B6", name: "삶의 방식을 바꾸는 책", order: 0 },
    { code: "B1", name: "나를 들여다보는 책", order: 1 },
    { code: "B2", name: "관계를 다시 생각하는 책", order: 2 },
  ],
  questions: [
    {
      type: "choice",
      text: "지금 끌리는 것",
      options: [
        {
          id: "change",
          text: "바꾸기",
          weights: [
            { drawer: "B6", weight: 3 },
            { drawer: "B1", weight: 1 },
          ],
        },
        {
          id: "look",
          text: "들여다보기",
          weights: [
            { drawer: "B1", weight: 3 },
            { drawer: "B2", weight: 1 },
          ],
        },
        { id: "rest", text: "쉬기", weights: [] },
      ],
    },
    {
      type: "choice",
      text: "책을 읽는 이유",
      options: [
        { id: "answer", text: "답을 찾으려고", weights: [{ drawer: "B6", weight: 2 }] },
        { id: "question", text: "질문을 얻으려고", weights: [{ drawer: "B1", weight: 2 }] },
      ],
    },
  ],
  scoring: { type: "choice-weight" },
});

describe("choice-weight", () => {
  it("고른 선택지의 서랍별 가중치를 더한다", () => {
    expect(scoreChoiceWeight(SET, ["change", "question"])).toStrictEqual({
      scoring: "choice-weight",
      drawers: [
        {
          drawer: "B6",
          score: 3,
          fives: 0,
          contributions: [{ question: 0, drawer: "B6", answer: "change", value: 3 }],
        },
        {
          drawer: "B1",
          score: 3,
          fives: 0,
          contributions: [
            { question: 0, drawer: "B1", answer: "change", value: 1 },
            { question: 1, drawer: "B1", answer: "question", value: 2 },
          ],
        },
        { drawer: "B2", score: 0, fives: 0, contributions: [] },
      ],
    });
  });

  it("가중치가 5인 기여도 동점 규칙의 5로 센다", () => {
    const set = parseQuestionSet({
      drawers: [
        { code: "B6", name: "삶의 방식을 바꾸는 책", order: 0 },
        { code: "B1", name: "나를 들여다보는 책", order: 1 },
      ],
      questions: [
        {
          type: "choice",
          text: "가장 끌리는 것",
          options: [
            { id: "a", text: "가", weights: [{ drawer: "B6", weight: 5 }] },
            { id: "b", text: "나", weights: [{ drawer: "B1", weight: 4 }] },
          ],
        },
      ],
      scoring: { type: "choice-weight" },
    });

    expect(scoreChoiceWeight(set, ["a"]).drawers[0].fives).toBe(1);
  });

  it("문항형 질문은 choice-weight 점수에 섞지 않는다", () => {
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
            { id: "look", text: "들여다보기", weights: [{ drawer: "B1", weight: 2 }] },
            { id: "rest", text: "쉬기", weights: [] },
          ],
        },
      ],
      scoring: { type: "choice-weight" },
    });

    expect(
      scoreChoiceWeight(set, [5, "look"]).drawers.map(({ drawer, score }) => [drawer, score]),
    ).toStrictEqual([
      ["B6", 0],
      ["B1", 2],
    ]);
  });
});
