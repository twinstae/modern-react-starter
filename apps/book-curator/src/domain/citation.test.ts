import { describe, expect, it } from "vite-plus/test";

import { parseQuestionSet } from "./question-set.ts";
import { SEOYUN_ANSWERS, SEOYUN_SET_INPUT } from "./seoyun.fixture.ts";
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

  it("기여가 같으면 문항 순서가 빠른 답을 인용한다", () => {
    const set = parseQuestionSet({
      drawers: [
        { id: "B6", name: "삶의 방식을 바꾸는 책" },
        { id: "B1", name: "나를 들여다보는 책" },
      ],
      questions: [
        { drawer: "B1", text: "첫 번째" },
        { drawer: "B6", text: "두 번째" },
        { drawer: "B6", text: "세 번째" },
      ],
    });

    expect(cite(set, scoreItemMean(set, [1, 4, 4]), "B6").question).toBe(1);
  });

  it("추천 서랍에 답한 문항이 없으면 인용을 지어내지 않고 이름 있는 오류로 실패한다", () => {
    const set = parseQuestionSet({
      drawers: [
        { id: "B6", name: "삶의 방식을 바꾸는 책" },
        { id: "B1", name: "나를 들여다보는 책" },
      ],
      questions: [{ drawer: "B1", text: "나는 어떤 사람인지 자주 생각한다" }],
    });

    expect(() => cite(set, scoreItemMean(set, [5]), "B6")).toThrow(NoCitationError);
  });
});
