import { describe, expect, it } from "vite-plus/test";

import {
  DEFAULT_CITATION_TEMPLATES,
  DEFAULT_STATEMENT_TEMPLATE,
  InvalidNicknameError,
  parseNickname,
  renderCitation,
  renderStatement,
  TemplateSyntaxError,
  UnknownJosaError,
  UnknownPlaceholderError,
} from "./statement.ts";

describe("parseNickname", () => {
  it("앞뒤 공백을 지우고 1~10 글자(코드 포인트)를 받는다", () => {
    expect(parseNickname("  토끼  ")).toBe("토끼");
    expect(parseNickname("🐰".repeat(10))).toBe("🐰".repeat(10));
  });

  it("비었거나 10 글자를 넘으면 이름 있는 오류로 거부한다", () => {
    expect(() => parseNickname("   ")).toThrow(InvalidNicknameError);
    expect(() => parseNickname("🐰".repeat(11))).toThrow(InvalidNicknameError);
    expect(() => parseNickname("가".repeat(11))).toThrow(InvalidNicknameError);
    expect(() => parseNickname(42)).toThrow(InvalidNicknameError);
  });
});

describe("renderStatement", () => {
  const drawerName = "삶의 방식을 바꾸는 책";

  it("별명 뒤에 늘 님을 붙이고 서랍 이름의 받침에 맞는 조사를 쓴다", () => {
    expect(renderStatement(DEFAULT_STATEMENT_TEMPLATE, { drawerName, nickname: "토끼" })).toBe(
      "토끼 님에게는 지금 삶의 방식을 바꾸는 책이 필요한 상태입니다",
    );
  });

  it("별명에 님이 이미 있어도 두 번 붙이지 않는다", () => {
    expect(renderStatement(DEFAULT_STATEMENT_TEMPLATE, { drawerName, nickname: "토끼 님" })).toBe(
      "토끼 님에게는 지금 삶의 방식을 바꾸는 책이 필요한 상태입니다",
    );
  });

  it("템플릿에 님이 이미 있어도 두 번 붙이지 않는다", () => {
    expect(
      renderStatement("{nickname}님에게는 {drawer:이/가} 필요합니다", {
        drawerName: "토끼",
        nickname: "토끼",
      }),
    ).toBe("토끼 님에게는 토끼가 필요합니다");
  });

  it("조사 자리표시마다 받침 규칙을 적용한다", () => {
    expect(
      renderStatement("{nickname} 님에게 {drawer:을/를} 권합니다", {
        drawerName: "토끼",
        nickname: "서윤",
      }),
    ).toBe("서윤 님에게 토끼를 권합니다");
    expect(
      renderStatement("{nickname} 님에게 {drawer:을/를} 권합니다", {
        drawerName: "책",
        nickname: "서윤",
      }),
    ).toBe("서윤 님에게 책을 권합니다");
    expect(
      renderStatement("{drawer:와/과} 함께 {drawer:(으)로} 갑니다", {
        drawerName: "서울",
        nickname: "서윤",
      }),
    ).toBe("서울과 함께 서울로 갑니다");
  });

  it("모르는 자리표시는 자리표시 이름과 함께 거부한다", () => {
    expect(() =>
      renderStatement("{nickname} 님에게 {shelf}를 권합니다", {
        drawerName: "토끼",
        nickname: "서윤",
      }),
    ).toThrow(UnknownPlaceholderError);

    try {
      renderStatement("{nickname} {shelf}", { drawerName: "토끼", nickname: "서윤" });
    } catch (error) {
      expect(error).toBeInstanceOf(UnknownPlaceholderError);
      expect((error as UnknownPlaceholderError).placeholder).toBe("shelf");
    }
  });

  it("모르는 조사는 자리표시 이름과 함께 거부한다", () => {
    try {
      renderStatement("{drawer:이/가/는}", { drawerName: "토끼", nickname: "서윤" });
      expect.unreachable("모르는 조사는 거부해야 합니다");
    } catch (error) {
      expect(error).toBeInstanceOf(UnknownJosaError);
      expect((error as UnknownJosaError).placeholder).toBe("drawer:이/가/는");
      expect((error as UnknownJosaError).josa).toBe("이/가/는");
    }
  });

  it("닫히지 않은 자리표시는 문법 오류로 거부한다", () => {
    expect(() => renderStatement("{nickname", { drawerName: "토끼", nickname: "서윤" })).toThrow(
      TemplateSyntaxError,
    );
    expect(() => renderStatement("닉네임 }", { drawerName: "토끼", nickname: "서윤" })).toThrow(
      TemplateSyntaxError,
    );
  });

  it("잘못된 별명은 문장을 만들기 전에 거부한다", () => {
    expect(() => renderStatement("{nickname}", { drawerName: "토끼", nickname: "" })).toThrow(
      InvalidNicknameError,
    );
  });
});

describe("renderCitation", () => {
  it("문항형과 선택형 문형에 인용 문장을 넣는다", () => {
    expect(renderCitation(DEFAULT_CITATION_TEMPLATES.item, { quote: "바꾸고 싶다" })).toBe(
      "‘바꾸고 싶다’에 그렇다고 답하신",
    );
    expect(renderCitation(DEFAULT_CITATION_TEMPLATES.choice, { quote: "바꾸기" })).toBe(
      "‘바꾸기’를 고르신",
    );
  });

  it("인용 문형에 모르는 자리표시가 있으면 거부한다", () => {
    expect(() => renderCitation("‘{quote}’ {drawer}", { quote: "바꾸기" })).toThrow(
      UnknownPlaceholderError,
    );
  });
});
