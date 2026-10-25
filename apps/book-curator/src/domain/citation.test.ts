import { describe, expect, it } from "vite-plus/test";

import { parseQuestionSet } from "./question-set.ts";
import { SEOYUN_ANSWERS, SEOYUN_SET_INPUT } from "./seoyun.fixture.ts";
import { scoreChoiceWeight } from "./scoring/choice-weight.ts";
import { scoreItemMean } from "./scoring/item-mean.ts";
import { cite, NoCitationError } from "./citation.ts";

describe("cite", () => {
  it("문항형은 추천 서랍에 가장 크게 기여한 답을 문항 문장과 함께 인용한다", () => {
    const set = parseQuestionSet(SEOYUN_SET_INPUT);
    const citation = cite(set, scoreItemMean(set, SEOYUN_ANSWERS), "B6");

    expect(citation).toStrictEqual({
      question: 0,
      drawer: "B6",
      answer: 5,
      quote: "요즘 생활에서 무언가를 바꾸고 싶다",
      text: "‘요즘 생활에서 무언가를 바꾸고 싶다’라고 하셨죠",
    });
  });

  it("반대 문항은 뒤집은 유효값이 가장 큰 답을 인용한다", () => {
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

    const citation = cite(set, scoreItemMean(set, [2, 2, 5]), "B6");

    expect(citation).toMatchObject({ question: 1, answer: 2, quote: "지금 그대로가 좋다" });
  });

  it("기여가 같으면 문항 순서가 빠른 답을 인용한다", () => {
    const set = parseQuestionSet({
      drawers: [
        { code: "B6", name: "삶의 방식을 바꾸는 책", order: 0 },
        { code: "B1", name: "나를 들여다보는 책", order: 1 },
      ],
      questions: [
        { type: "item", drawer: "B1", reversed: false, text: "첫 번째" },
        { type: "item", drawer: "B6", reversed: false, text: "두 번째" },
        { type: "item", drawer: "B6", reversed: false, text: "세 번째" },
      ],
      scoring: { type: "item-mean" },
    });

    expect(cite(set, scoreItemMean(set, [1, 4, 4]), "B6").question).toBe(1);
  });

  it("선택형은 가중치가 가장 큰 선택지를 선택지 문장과 함께 인용한다", () => {
    const set = parseQuestionSet({
      drawers: [
        { code: "B6", name: "삶의 방식을 바꾸는 책", order: 0 },
        { code: "B1", name: "나를 들여다보는 책", order: 1 },
      ],
      questions: [
        {
          type: "choice",
          text: "지금 끌리는 것",
          options: [
            { id: "change", text: "바꾸기", weights: [{ drawer: "B6", weight: 3 }] },
            { id: "look", text: "들여다보기", weights: [{ drawer: "B1", weight: 3 }] },
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

    expect(cite(set, scoreChoiceWeight(set, ["change", "question"]), "B6")).toStrictEqual({
      question: 0,
      drawer: "B6",
      answer: "change",
      quote: "바꾸기",
      text: "‘바꾸기’를 고르셨어요",
    });
  });

  it("추천 서랍에 긍정적으로 기여한 답이 없으면 이름 있는 오류로 실패한다", () => {
    const zeroSet = parseQuestionSet({
      drawers: [
        { code: "B6", name: "삶의 방식을 바꾸는 책", order: 0 },
        { code: "B1", name: "나를 들여다보는 책", order: 1 },
      ],
      questions: [
        {
          type: "choice",
          text: "지금 끌리는 것",
          options: [
            { id: "rest", text: "쉬기", weights: [] },
            { id: "look", text: "들여다보기", weights: [] },
          ],
        },
      ],
      scoring: { type: "choice-weight" },
    });

    expect(() => cite(zeroSet, scoreChoiceWeight(zeroSet, ["rest"]), "B6")).toThrow(
      NoCitationError,
    );

    const negativeSet = parseQuestionSet({
      drawers: [
        { code: "B6", name: "삶의 방식을 바꾸는 책", order: 0 },
        { code: "B1", name: "나를 들여다보는 책", order: 1 },
      ],
      questions: [
        {
          type: "choice",
          text: "지금 끌리는 것",
          options: [
            { id: "rest", text: "쉬기", weights: [{ drawer: "B6", weight: -1 }] },
            { id: "look", text: "들여다보기", weights: [{ drawer: "B1", weight: -2 }] },
          ],
        },
      ],
      scoring: { type: "choice-weight" },
    });

    expect(() => cite(negativeSet, scoreChoiceWeight(negativeSet, ["rest"]), "B6")).toThrow(
      NoCitationError,
    );
  });
});
