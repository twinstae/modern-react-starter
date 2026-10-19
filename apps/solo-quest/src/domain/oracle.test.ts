import { describe, expect, it } from "vitest";

import { SEED_ORACLES } from "../data/oracle-seed.ts";
import { parseOracle, rollOracle, type Oracle } from "./oracle.ts";

const at = (random: number) => () => random;

const rows = (...pairs: [number, number, string][]) =>
  pairs.map(([min, max, result]) => ({ min, max, result }));

const input = (overrides: Partial<Oracle> = {}) => ({
  id: "o-1",
  name: "행동",
  sides: 10,
  rows: rows([1, 4, "꾸민다"], [5, 10, "불러낸다"]),
  ...overrides,
});

describe("오라클 표 읽기", () => {
  it("이름과 결과의 앞뒤 공백을 빼고 줄을 눈 순서로 돌려준다", () => {
    const parsed = parseOracle(
      input({
        name: " 행동 ",
        rows: rows([5, 10, " 불러낸다 "], [1, 4, "꾸민다"]),
      }),
    );

    expect(parsed).toStrictEqual({
      ok: true,
      oracle: {
        id: "o-1",
        name: "행동",
        sides: 10,
        rows: rows([1, 4, "꾸민다"], [5, 10, "불러낸다"]),
      },
    });
  });

  it("설명이 있으면 앞뒤 공백을 빼고 담는다", () => {
    const parsed = parseOracle(input({ description: " 세 열을 합친 것 " }));

    expect(parsed.ok && parsed.oracle.description).toBe("세 열을 합친 것");
  });

  it.each([
    ["빈 이름", { name: "  " }, "내용을 입력해주세요"],
    ["면이 1", { sides: 1 }, "주사위 면은 2 이상이어야 합니다"],
    ["면이 정수가 아님", { sides: 10.5 }, "주사위 면은 정수여야 합니다"],
    ["줄이 없음", { rows: [] }, "표에 줄이 하나도 없습니다"],
    ["1부터 시작하지 않음", { rows: rows([2, 10, "가"]) }, "표는 1부터 시작해야 합니다: 2"],
    [
      "범위가 이어지지 않음",
      { rows: rows([1, 4, "가"], [6, 10, "나"]) },
      "범위가 이어지지 않습니다: 5",
    ],
    ["범위가 겹침", { rows: rows([1, 5, "가"], [5, 10, "나"]) }, "범위가 겹칩니다: 5–10"],
    [
      "시작이 끝보다 큼",
      { rows: rows([1, 4, "가"], [8, 6, "나"], [7, 10, "다"]) },
      "범위의 시작이 끝보다 큽니다: 8–6",
    ],
    ["끝까지 덮지 않음", { rows: rows([1, 9, "가"]) }, "표는 10까지 덮어야 합니다: 9"],
    [
      "면을 넘는 범위",
      { rows: rows([1, 4, "가"], [5, 11, "나"]) },
      "범위는 1부터 10 사이여야 합니다: 5–11",
    ],
    [
      "정수가 아닌 범위",
      { rows: rows([1.5, 4, "가"], [5, 10, "나"]) },
      "범위의 시작과 끝은 정수여야 합니다",
    ],
    ["빈 결과", { rows: rows([1, 4, " "], [5, 10, "나"]) }, "결과를 입력해주세요"],
  ])("%s은 오류다", (_name, overrides, message) => {
    expect(parseOracle(input(overrides))).toStrictEqual({ ok: false, message });
  });

  it("결과가 500자를 넘으면 오류다", () => {
    expect(
      parseOracle(input({ rows: rows([1, 4, "가".repeat(501)], [5, 10, "나"]) })),
    ).toStrictEqual({
      ok: false,
      message: "결과는 500자 이하로 입력해주세요",
    });
  });
});

describe("오라클 굴림", () => {
  const oracle: Oracle = input() as Oracle;

  it.each([
    [0, 1, "꾸민다"],
    [0.3, 4, "꾸민다"],
    [0.4, 5, "불러낸다"],
    [0.999, 10, "불러낸다"],
  ])("난수 %s면 %s이 나와 %s가 된다", (random, value, result) => {
    expect(rollOracle(oracle, at(random))).toStrictEqual({ ok: true, value, result });
  });

  it("d6 표도 같은 규칙으로 굴린다", () => {
    const weather: Oracle = {
      id: "weather",
      name: "날씨",
      sides: 6,
      rows: rows([1, 3, "맑음"], [4, 6, "폭풍"]),
    };

    expect(rollOracle(weather, at(0.5))).toStrictEqual({ ok: true, value: 4, result: "폭풍" });
  });

  it("어느 줄에도 들지 않는 눈이면 오류다", () => {
    const broken: Oracle = { ...oracle, rows: rows([1, 4, "꾸민다"]) };

    expect(rollOracle(broken, at(0.5))).toStrictEqual({
      ok: false,
      message: "6에 해당하는 결과가 없습니다: 행동",
    });
  });
});

describe("Ironsworn 오라클 시드", () => {
  it("19개의 오라클이 모두 올바른 표다", () => {
    expect(SEED_ORACLES).toHaveLength(19);
    const problems = SEED_ORACLES.map((oracle) => [oracle.id, parseOracle(oracle)] as const).filter(
      ([, parsed]) => !parsed.ok,
    );

    expect(problems).toStrictEqual([]);
  });

  it("구간이 있는 표와 d100 표를 담고 있다", () => {
    const action = SEED_ORACLES.find(({ id }) => id === "ironsworn-action");

    expect(action?.sides).toBe(100);
    expect(action?.rows).toHaveLength(100);
    expect(SEED_ORACLES.find(({ id }) => id === "ironsworn-location")?.rows[0]).toStrictEqual({
      min: 1,
      max: 1,
      result: "은신처",
    });
    expect(SEED_ORACLES.find(({ id }) => id === "ironsworn-challenge-rank")?.rows).toStrictEqual([
      { min: 1, max: 20, result: "성가신" },
      { min: 21, max: 55, result: "위험한" },
      { min: 56, max: 80, result: "막강한" },
      { min: 81, max: 93, result: "극한" },
      { min: 94, max: 100, result: "서사" },
    ]);
  });
});
