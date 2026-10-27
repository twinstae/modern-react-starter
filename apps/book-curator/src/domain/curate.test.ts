import { expectTypeOf } from "vite-plus/test";
import { describe, expect, it } from "vite-plus/test";

import { NoCitationError } from "./citation.ts";
import { curate, type CustomerCuration } from "./curate.ts";
import { SEOYUN_ANSWERS, SEOYUN_SET_INPUT } from "./seoyun.fixture.ts";
import { parseQuestionSet } from "./question-set.ts";

describe("curate", () => {
  it("서윤의 답을 별명과 상태 문장, 추천 서랍, 인용으로 만든다", () => {
    const set = parseQuestionSet(SEOYUN_SET_INPUT);
    const curation = curate(set, SEOYUN_ANSWERS, "토끼");

    expect(curation.ranking).toStrictEqual({ first: "B6", second: "B1", similar: false });
    expect(curation.customer).toStrictEqual({
      firstStatement: "토끼 님에겐 지금, 삶의 방식을 바꾸는 책이 필요해 보여요",
      secondStatement: "나를 들여다보는 책이 함께 보이면 좋겠어요",
      recommendedDrawerName: "삶의 방식을 바꾸는 책",
      citation: "‘요즘 생활에서 무언가를 바꾸고 싶다’라고 하셨죠",
    });
  });

  it("같은 입력은 같은 결과를 내고 별명만 바꾸면 문장만 바뀐다", () => {
    const set = parseQuestionSet(SEOYUN_SET_INPUT);

    expect(curate(set, SEOYUN_ANSWERS, "토끼")).toStrictEqual(curate(set, SEOYUN_ANSWERS, "토끼"));
    expect(curate(set, SEOYUN_ANSWERS, "서윤").customer.recommendedDrawerName).toBe(
      curate(set, SEOYUN_ANSWERS, "토끼").customer.recommendedDrawerName,
    );
  });

  it("인용할 답이 없는 답 목록은 이름 있는 오류로 거부한다", () => {
    const set = parseQuestionSet(SEOYUN_SET_INPUT);

    expect(() => curate(set, [], "토끼")).toThrow(NoCitationError);
  });

  it("손님 view model에는 점수·서랍 코드·다른 서랍 책이 없다(I-9)", () => {
    const customer = curate(parseQuestionSet(SEOYUN_SET_INPUT), SEOYUN_ANSWERS, "토끼").customer;

    expect(Object.keys(customer).sort()).toStrictEqual([
      "citation",
      "firstStatement",
      "recommendedDrawerName",
      "secondStatement",
    ]);
    expect(JSON.stringify(customer)).not.toMatch(/\bB[1-7]\b/);
    expect(JSON.stringify(customer)).not.toMatch(/score/i);

    expectTypeOf<keyof CustomerCuration>().toEqualTypeOf<
      "firstStatement" | "secondStatement" | "recommendedDrawerName" | "citation"
    >();
    expectTypeOf<
      Extract<CustomerCuration[keyof CustomerCuration], number>
    >().toEqualTypeOf<never>();
  });
});
