import { describe, expect, it } from "vitest";
import * as v from "valibot";

import { ShortText } from "./short-text.ts";

describe("짧은 글 (ShortText)", () => {
  it("앞뒤 공백을 뺀 1~140자를 받아들이고, 공백을 뺀 값을 돌려준다", () => {
    expect(v.parse(ShortText, "  안녕하세요  ")).toBe("안녕하세요");
    expect(v.parse(ShortText, "가".repeat(140))).toBe("가".repeat(140));
  });

  it("줄바꿈은 그대로 둔다", () => {
    expect(v.parse(ShortText, "첫 줄\n둘째 줄")).toBe("첫 줄\n둘째 줄");
  });

  it.each([
    ["빈 글", ""],
    ["공백만 있는 글", "   \n "],
    ["141자 글", "가".repeat(141)],
  ])("%s은 거부한다", (_name, input) => {
    expect(v.safeParse(ShortText, input).success).toBe(false);
  });
});
