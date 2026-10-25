import { describe, expect, it } from "vite-plus/test";

import { attachJosa, InvalidJosaPairError, InvalidJosaWordError, type JosaPair } from "./josa.ts";

describe("attachJosa", () => {
  it("받침이 있는 이름과 없는 이름에 맞는 조사를 붙인다", () => {
    expect(attachJosa("책", "이/가")).toBe("책이");
    expect(attachJosa("토끼", "이/가")).toBe("토끼가");
    expect(attachJosa("책", "을/를")).toBe("책을");
    expect(attachJosa("토끼", "을/를")).toBe("토끼를");
    expect(attachJosa("책", "은/는")).toBe("책은");
    expect(attachJosa("토끼", "은/는")).toBe("토끼는");
    expect(attachJosa("책", "와/과")).toBe("책과");
    expect(attachJosa("토끼", "와/과")).toBe("토끼와");
  });

  it("(으)로는 받침 없는 이름과 ㄹ 받침이면 로, 그 밖의 받침이면 으로다", () => {
    expect(attachJosa("토끼", "(으)로")).toBe("토끼로");
    expect(attachJosa("서울", "(으)로")).toBe("서울로");
    expect(attachJosa("책", "(으)로")).toBe("책으로");
    expect(attachJosa("집", "(으)로")).toBe("집으로");
  });

  it("한글이 아닌 글자로 끝나면 받침이 없는 것으로 본다", () => {
    expect(attachJosa("Book", "이/가")).toBe("Book가");
    expect(attachJosa("Book", "을/를")).toBe("Book를");
    expect(attachJosa("Book", "은/는")).toBe("Book는");
    expect(attachJosa("Book", "와/과")).toBe("Book와");
    expect(attachJosa("Book", "(으)로")).toBe("Book로");
    expect(attachJosa("🐰", "이/가")).toBe("🐰가");
    expect(attachJosa("🐰", "(으)로")).toBe("🐰로");
  });

  it("마지막 글자를 보기 전에 끝의 공백을 지운다", () => {
    expect(attachJosa("책  \n", "이/가")).toBe("책이");
    expect(attachJosa("토끼 ", "(으)로")).toBe("토끼로");
  });

  it("모든 한글 음절에서 받침 규칙과 맞는다(I-10)", () => {
    const pairs: readonly JosaPair[] = ["이/가", "을/를", "은/는", "와/과", "(으)로"];

    for (let code = 0xac00; code <= 0xd7a3; code += 1) {
      const word = String.fromCodePoint(code);
      const final = (code - 0xac00) % 28;
      const hasFinal = final !== 0;

      const expected: Record<JosaPair, string> = {
        "이/가": `${word}${hasFinal ? "이" : "가"}`,
        "을/를": `${word}${hasFinal ? "을" : "를"}`,
        "은/는": `${word}${hasFinal ? "은" : "는"}`,
        "와/과": `${word}${hasFinal ? "과" : "와"}`,
        "(으)로": `${word}${!hasFinal || final === 8 ? "로" : "으로"}`,
      };

      for (const pair of pairs) {
        expect(attachJosa(word, pair), `${word} ${pair}`).toBe(expected[pair]);
      }
    }
  });

  it("비었거나 공백뿐인 이름, 모르는 조사 쌍은 이름 있는 오류로 거부한다", () => {
    expect(() => attachJosa("   ", "이/가")).toThrow(InvalidJosaWordError);
    expect(() => attachJosa("책", "이/가/는" as JosaPair)).toThrow(InvalidJosaPairError);
  });
});
