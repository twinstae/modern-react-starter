import { expectTypeOf } from "vite-plus/test";
import { describe, expect, it } from "vite-plus/test";

import { NoCitationError } from "./citation.ts";
import { curate, type CustomerCuration } from "./curate.ts";
import type { DrawerCode } from "./question-set.ts";
import { SEOYUN_ANSWERS, SEOYUN_SET_INPUT } from "./seoyun.fixture.ts";
import { parseQuestionSet } from "./question-set.ts";

describe("curate", () => {
  it("서윤의 답을 별명과 상태 문장, 추천 서랍, 인용으로 만든다", () => {
    const set = parseQuestionSet(SEOYUN_SET_INPUT);
    const curation = curate(set, SEOYUN_ANSWERS, "토끼");

    expect(curation.ranking).toStrictEqual({ first: "B6", second: "B1", similar: false });
    expect(curation.customer).toStrictEqual({
      firstStatement: "토끼 님에게는 지금 삶의 방식을 바꾸는 책이 필요한 상태입니다",
      secondStatement: "토끼 님에게는 지금 나를 들여다보는 책이 필요한 상태입니다",
      recommendedDrawerName: "삶의 방식을 바꾸는 책",
      recommendedStatement: "토끼 님에게는 지금 삶의 방식을 바꾸는 책이 필요한 상태입니다",
      citation: "‘요즘 생활에서 무언가를 바꾸고 싶다’에 그렇다고 답하신",
    });
  });

  it("서랍별 고유 문장이 있으면 공통 템플릿 대신 쓴다", () => {
    const set = parseQuestionSet({
      ...SEOYUN_SET_INPUT,
      statementTemplate: "{nickname} 님에게는 {drawer:이/가} 필요합니다",
      drawers: SEOYUN_SET_INPUT.drawers.map((drawer) =>
        drawer.code === "B6"
          ? { ...drawer, statement: "{nickname} 님의 삶을 바꿀 {drawer:이/가} 여기 있습니다" }
          : drawer,
      ),
    });

    const curation = curate(set, SEOYUN_ANSWERS, " 토끼 ");

    expect(curation.customer.firstStatement).toBe(
      "토끼 님의 삶을 바꿀 삶의 방식을 바꾸는 책이 여기 있습니다",
    );
    expect(curation.customer.secondStatement).toBe("토끼 님에게는 나를 들여다보는 책이 필요합니다");
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
      "recommendedStatement",
      "secondStatement",
    ]);
    expect(JSON.stringify(customer)).not.toMatch(/\bB[1-7]\b/);
    expect(JSON.stringify(customer)).not.toMatch(/score/i);

    expectTypeOf<keyof CustomerCuration>().toEqualTypeOf<
      | "firstStatement"
      | "secondStatement"
      | "recommendedDrawerName"
      | "recommendedStatement"
      | "citation"
    >();
    expectTypeOf<
      Extract<CustomerCuration[keyof CustomerCuration], DrawerCode>
    >().toEqualTypeOf<never>();
    expectTypeOf<
      Extract<CustomerCuration[keyof CustomerCuration], number>
    >().toEqualTypeOf<never>();
  });
});
