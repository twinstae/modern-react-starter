import { describe, expect, it } from "vitest";

import { MAX_DICE, MAX_SIDES, parseNotation, roll, type DiceTerm, type Random } from "./dice.ts";

const dice = (count: number, sides: number, sign: 1 | -1 = 1): DiceTerm => ({
  type: "dice",
  sign,
  count,
  sides,
});
const constant = (value: number, sign: 1 | -1 = 1): DiceTerm => ({ type: "constant", sign, value });

describe("표기 파서", () => {
  it.each([
    ["d20", [dice(1, 20)]],
    ["d100", [dice(1, 100)]],
    ["2d6+1", [dice(2, 6), constant(1)]],
    ["3d6+2", [dice(3, 6), constant(2)]],
    ["3d6-2+1d4", [dice(3, 6), constant(2, -1), dice(1, 4)]],
    ["2D6", [dice(2, 6)]],
    ["5", [constant(5)]],
    [`${MAX_DICE}d${MAX_SIDES}`, [dice(MAX_DICE, MAX_SIDES)]],
    [`${MAX_DICE - 1}d6+1d6`, [dice(MAX_DICE - 1, 6), dice(1, 6)]],
  ])("%s는 항 목록이 된다", (text, terms) => {
    expect(parseNotation(text)).toStrictEqual({ ok: true, terms });
  });

  it.each([
    ["2x6"],
    ["d"],
    ["2d"],
    ["0d6"],
    ["2d0"],
    ["2d6+"],
    [""],
    ["+2d6"],
    ["2d6++1"],
    ["2 d6"],
    [`${MAX_DICE + 1}d6`],
    [`1d${MAX_SIDES + 1}`],
    [`${MAX_DICE}d6+1d6`],
  ])("%j는 오류다", (text) => {
    const result = parseNotation(text);

    expect(result.ok).toBe(false);
  });

  it("오류는 사용자에게 보여 줄 메시지를 가진다", () => {
    expect(parseNotation("2x6")).toStrictEqual({
      ok: false,
      message: "주사위 표기가 올바르지 않습니다: 2x6",
    });
    expect(parseNotation(`${MAX_DICE + 1}d6`)).toStrictEqual({
      ok: false,
      message: `주사위는 모두 ${MAX_DICE}개까지 굴릴 수 있습니다`,
    });
    expect(parseNotation(`1d${MAX_SIDES + 1}`)).toStrictEqual({
      ok: false,
      message: `주사위 면은 ${MAX_SIDES}개까지 쓸 수 있습니다`,
    });
  });
});

/** 넘긴 값을 차례로 내는 난수 */
const sequence = (...values: number[]): Random => {
  let next = 0;
  return () => values[next++] ?? 0;
};

describe("굴림", () => {
  it("주사위마다 난수로 값을 정하고, 상수와 빼기 항을 반영해 합계를 낸다", () => {
    // d6: floor(0.5 * 6) + 1 = 4, floor(0.99 * 6) + 1 = 6, d4: floor(0.3 * 4) + 1 = 2
    const result = roll(
      [dice(2, 6), constant(1, -1), dice(1, 4, -1), constant(10)],
      sequence(0.5, 0.99, 0.3),
    );

    expect(result).toStrictEqual({
      terms: [
        { type: "dice", sign: 1, sides: 6, values: [4, 6] },
        { type: "constant", sign: -1, value: 1 },
        { type: "dice", sign: -1, sides: 4, values: [2] },
        { type: "constant", sign: 1, value: 10 },
      ],
      total: 4 + 6 - 1 - 2 + 10,
    });
  });
});
