import { describe, expect, it } from "vitest";

import {
  MAX_DICE,
  MAX_SIDES,
  parseNotation,
  parseRoll,
  roll,
  type DiceTerm,
  type Random,
} from "./dice.ts";

const dice = (count: number, sides: number, sign: 1 | -1 = 1): DiceTerm => ({
  type: "dice",
  sign,
  count,
  sides,
});
const fate = (count: number, sign: 1 | -1 = 1): DiceTerm => ({ type: "fate", sign, count });
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
    ["4dF+3", [fate(4), constant(3)]],
    ["df-2df", [fate(1), fate(2, -1)]],
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
    ["0dF"],
    [`${MAX_DICE}dF+1d6`],
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

describe("판정 표기 파서", () => {
  const against = {
    dice: (count: number, sides: number) => ({ type: "dice" as const, count, sides }),
    number: (value: number) => ({ type: "number" as const, value }),
  };

  it.each([
    ["던전월드", "2d6+1", { terms: [dice(2, 6), constant(1)] }],
    [
      "Ironsworn",
      "d6+2+1 max10 > 2d10",
      {
        terms: [dice(1, 6), constant(2), constant(1)],
        check: { op: ">", cap: 10, against: against.dice(2, 10) },
      },
    ],
    [
      "Cypher",
      "d20 >= 3*3",
      { terms: [dice(1, 20)], check: { op: ">=", against: against.number(9) } },
    ],
    [
      "겁스",
      "3d6 <= 12",
      { terms: [dice(3, 6)], check: { op: "<=", against: against.number(12) } },
    ],
    [
      "Fate",
      "4dF+3 >= 2",
      { terms: [fate(4), constant(3)], check: { op: ">=", against: against.number(2) } },
    ],
    ["작다", "d20 < 0", { terms: [dice(1, 20)], check: { op: "<", against: against.number(0) } }],
    [
      "대문자와 여러 공백",
      "D6  MAX10   >  D10",
      { terms: [dice(1, 6)], check: { op: ">", cap: 10, against: against.dice(1, 10) } },
    ],
  ])("%s: %s는 판정 계획이 된다", (_system, text, plan) => {
    expect(parseRoll(text)).toStrictEqual({ ok: true, plan });
  });

  it.each([
    ["d6 > 2d10+1"],
    ["d6 > d10*2"],
    ["d6 > 4dF"],
    ["d6 > -1"],
    ["d6 > 3*"],
    ["d6 >"],
    ["d6 = 3"],
    ["d6 > 0d10"],
    ["d6 max10"],
    ["d6 max0 > 2d10"],
    ["d6 > 2d10 max10"],
    ["d6 > 2d10 d6"],
    ["2x6 > 2d10"],
    [`d6 > ${MAX_DICE}d10`],
  ])("%j는 오류다", (text) => {
    expect(parseRoll(text).ok).toBe(false);
  });

  it("목표가 틀리면 고칠 방법을 알려 준다", () => {
    expect(parseRoll("d6 > 2d10+1")).toStrictEqual({
      ok: false,
      message: "목표에는 2d10 같은 도전 주사위 하나나 9, 3*3 같은 목표치를 적어주세요",
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

  it("Fate 주사위는 난수를 셋으로 나눠 -1, 0, +1이 나오고, 빼는 항은 합계에서 뺀다", () => {
    const result = roll([fate(3), fate(1, -1)], sequence(0, 0.5, 0.99, 0.99));

    expect(result).toStrictEqual({
      terms: [
        { type: "fate", sign: 1, values: [-1, 0, 1] },
        { type: "fate", sign: -1, values: [1] },
      ],
      total: -1 + 0 + 1 - 1,
    });
  });

  const LARGEST_BELOW_ONE = 1 - Number.EPSILON / 2;

  it.each([2, 3, 6, 7, 10, 20, 100, 999, MAX_SIDES])(
    "난수가 0이면 d%i는 1이고, 1에 가장 가까우면 면 수가 나온다",
    (sides) => {
      const { terms } = roll([dice(2, sides)], sequence(0, LARGEST_BELOW_ONE));

      expect(terms).toStrictEqual([{ type: "dice", sign: 1, sides, values: [1, sides] }]);
    },
  );
});
