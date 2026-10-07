import { describe, expect, it } from "vitest";

import { parseInput } from "./parse-input.ts";

describe("입력 해석", () => {
  it("/로 시작하지 않으면 입력 그대로 대화다", () => {
    expect(parseInput("문이 열린다")).toStrictEqual({ type: "message", content: "문이 열린다" });
  });

  it("/r 뒤의 첫 토큰은 표기이고, 라벨이 없으면 라벨을 생략한다", () => {
    expect(parseInput("/r 2d6+1")).toStrictEqual({ type: "roll", notation: "2d6+1" });
  });

  it("표기 뒤의 나머지는 앞뒤 공백을 뺀 라벨이다", () => {
    expect(parseInput("/r 2d6+1   자물쇠 따기  ")).toStrictEqual({
      type: "roll",
      notation: "2d6+1",
      label: "자물쇠 따기",
    });
  });

  it.each([
    ["알 수 없는 명령", "/desc 안개", "알 수 없는 명령입니다: /desc"],
    ["표기가 없는 /r", "/r", "굴릴 주사위 표기를 적어주세요. 예: /r 2d6+1"],
    ["공백만 뒤따르는 /r", "/r   ", "굴릴 주사위 표기를 적어주세요. 예: /r 2d6+1"],
  ])("%s는 오류다", (_name, text, message) => {
    expect(parseInput(text)).toStrictEqual({ type: "error", message });
  });
});
