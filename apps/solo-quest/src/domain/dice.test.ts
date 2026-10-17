import { describe, expect, it } from "vitest";

import {
  MAX_DICE,
  MAX_SIDES,
  parseNotation,
  judgeRoll,
  parseRoll,
  roll,
  rollPlan,
  type RolledTerm,
  type RollResult,
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

describe("비교 판정 굴림", () => {
  it("액션 주사위를 먼저 굴리고 도전 주사위를 굴린다", () => {
    // d6: floor(0.5 * 6) + 1 = 4, d10: floor(0.2 * 10) + 1 = 3, floor(0.9 * 10) + 1 = 10
    const result = rollPlan(
      {
        terms: [dice(1, 6), constant(2)],
        check: { op: ">", cap: 10, against: { type: "dice", count: 2, sides: 10 } },
      },
      sequence(0.5, 0.2, 0.9),
    );

    expect(result).toStrictEqual({
      terms: [
        { type: "dice", sign: 1, sides: 6, values: [4] },
        { type: "constant", sign: 1, value: 2 },
      ],
      total: 6,
      check: { op: ">", cap: 10, against: { type: "dice", sides: 10, values: [3, 10] } },
    });
  });

  it("목표치는 굴리지 않고 그대로 남는다", () => {
    const result = rollPlan(
      { terms: [dice(1, 20)], check: { op: ">=", against: { type: "number", value: 9 } } },
      sequence(0.5),
    );

    expect(result.check).toStrictEqual({ op: ">=", against: { type: "number", value: 9 } });
  });

  it("비교가 없으면 roll과 같다", () => {
    const terms = [dice(2, 6), constant(1)];

    expect(rollPlan({ terms }, sequence(0.5, 0.2))).toStrictEqual(roll(terms, sequence(0.5, 0.2)));
  });
});

/** 액션 쪽 항과 비교로 굴린 결과를 만든다. 합계는 항에서 계산한다. */
const rolled = (terms: RollResult["terms"], check?: RollResult["check"]): RollResult => ({
  terms,
  total: terms.reduce(
    (sum, term) =>
      sum +
      term.sign * (term.type === "constant" ? term.value : term.values.reduce((a, b) => a + b, 0)),
    0,
  ),
  ...(check && { check }),
});
const d = (sides: number, ...values: number[]): RolledTerm => ({
  type: "dice",
  sign: 1,
  sides,
  values,
});
const c = (value: number, sign: 1 | -1 = 1): RolledTerm => ({ type: "constant", sign, value });
const challenge = (op: ">" | ">=", ...values: number[]) => ({
  op,
  against: { type: "dice" as const, sides: 10, values },
});
const target = (op: ">" | ">=" | "<" | "<=", value: number) => ({
  op,
  against: { type: "number" as const, value },
});

describe("판정 값", () => {
  it.each([
    // 사용자 예: 액션 6
    [[3, 5], [true, true], 2],
    [[5, 7], [true, false], 1],
    [[7, 6], [false, false], 0],
  ])("Ironsworn: 액션 6, 도전 %j는 %j로 %i개를 이긴다", (values, wins, value) => {
    const judged = judgeRoll(rolled([d(6, 3), c(2), c(1)], challenge(">", ...values)));

    expect(judged).toMatchObject({ score: 6, wins, value });
  });

  it("> 는 같으면 지고, >= 는 같아도 이긴다", () => {
    expect(judgeRoll(rolled([d(6, 6)], challenge(">", 6, 5))).wins).toStrictEqual([false, true]);
    expect(judgeRoll(rolled([d(6, 6)], challenge(">=", 6, 5))).wins).toStrictEqual([true, true]);
  });

  it("액션 점수는 상한을 넘지 않는다", () => {
    const capped = { ...challenge(">", 9, 10), cap: 10 };

    expect(judgeRoll(rolled([d(6, 6), c(7)], capped))).toMatchObject({ score: 10, value: 1 });
    expect(judgeRoll(rolled([d(6, 1), c(7)], capped)).score).toBe(8);
  });

  it.each([
    [[4, 4], true],
    [[4, 5], false],
    [[4], false],
    [[2, 2, 2], true],
  ])("도전 주사위 %j는 Match가 %s다", (values, match) => {
    expect(judgeRoll(rolled([d(6, 6)], challenge(">", ...values))).match).toBe(match);
  });

  it.each([
    ["Cypher 성공", [d(20, 9)], target(">=", 9), 0, true],
    ["Cypher 실패", [d(20, 8)], target(">=", 9), -1, false],
    ["겁스 성공", [d(6, 3, 3, 4)], target("<=", 12), 2, true],
    ["겁스 실패", [d(6, 6, 6, 1)], target("<=", 12), -1, false],
    ["> 같음", [d(20, 9)], target(">", 9), 0, false],
    ["< 같음", [d(20, 9)], target("<", 9), 0, false],
    ["< 작음", [d(20, 8)], target("<", 9), 1, true],
  ])("%s: 차이는 %i, 성공은 %s다", (_name, terms, check, value, success) => {
    expect(judgeRoll(rolled(terms, check))).toMatchObject({ value, success });
  });

  it("Fate: 4dF+3 >= 2에서 [+, 0, -, +]면 점수 4, 차이 2로 성공이다", () => {
    const fateTerm: RolledTerm = { type: "fate", sign: 1, values: [1, 0, -1, 1] };

    expect(judgeRoll(rolled([fateTerm, c(3)], target(">=", 2)))).toMatchObject({
      score: 4,
      value: 2,
      success: true,
    });
  });

  it("비교가 없으면 결과 값은 액션 점수이고 성공과 승패는 없다", () => {
    const judged = judgeRoll(rolled([d(6, 4, 5), c(1, -1)]));

    expect(judged).toStrictEqual({ score: 8, value: 8, match: false, natural: 9 });
  });

  it("눈은 액션 쪽 주사위만 더하고 빼는 주사위는 뺀다", () => {
    const judged = judgeRoll(rolled([d(20, 17), c(3), { ...d(4, 2), sign: -1 }], target(">=", 9)));

    expect(judged.natural).toBe(15);
  });
});
