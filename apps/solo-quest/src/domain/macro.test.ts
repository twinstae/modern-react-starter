import { describe, expect, it } from "vitest";

import type { Judgement } from "./dice.ts";
import { fillMacro, nameResult, parseMacro, type ParsedMacro } from "./macro.ts";

/** 문서와 화면 예시에 쓰는 다섯 시스템의 매크로 식 */
const IRONSWORN =
  "d6+{능력치:1..4}+{수정치:0..4} max10 > 2d10 => 0 실패 | 1 약한 성공 | 2 강한 성공";
const CYPHER =
  "d20 >= {난이도:0..10}*3 => ..-1 실패 | 0.. 성공 ; 20 큰 이득, 19 작은 이득, 1 마스터 개입";
const GURPS =
  "3d6 <= {기술:3..20} => ..-10 대실패 | -9..-1 실패 | 0.. 성공 ; 3..4 !대성공, 17 !실패, 18 !대실패";
const FATE = "4dF+{기술:0..5} >= {상대:0..8} => ..-1 실패 | 0 동점 | 1..2 성공 | 3.. 멋진 성공";
const DUNGEON_WORLD = "2d6+{능력치:-1..3} => ..6 실패 | 7..9 약한 성공 | 10.. 강한 성공";

describe("매크로 식 파서", () => {
  it("Ironsworn: 빈칸과 이긴 개수마다 결과 이름을 읽는다", () => {
    expect(parseMacro(IRONSWORN)).toStrictEqual({
      ok: true,
      macro: {
        template: "d6+{능력치:1..4}+{수정치:0..4} max10 > 2d10",
        slots: [
          { name: "능력치", min: 1, max: 4 },
          { name: "수정치", min: 0, max: 4 },
        ],
        outcomes: [
          { range: { min: 0, max: 0 }, name: "실패" },
          { range: { min: 1, max: 1 }, name: "약한 성공" },
          { range: { min: 2, max: 2 }, name: "강한 성공" },
        ],
        effects: [],
      },
    });
  });

  it("Cypher: 열린 범위의 결과 이름과 눈 효과를 읽는다", () => {
    const result = parseMacro(CYPHER);

    expect(result).toMatchObject({
      ok: true,
      macro: {
        template: "d20 >= {난이도:0..10}*3",
        slots: [{ name: "난이도", min: 0, max: 10 }],
        outcomes: [
          { range: { max: -1 }, name: "실패" },
          { range: { min: 0 }, name: "성공" },
        ],
        effects: [
          { range: { min: 20, max: 20 }, name: "큰 이득", replace: false },
          { range: { min: 19, max: 19 }, name: "작은 이득", replace: false },
          { range: { min: 1, max: 1 }, name: "마스터 개입", replace: false },
        ],
      },
    });
  });

  it("겁스: !가 붙은 눈 효과는 결과 이름을 바꾼다", () => {
    const result = parseMacro(GURPS);

    expect(result.ok && result.macro.effects).toStrictEqual([
      { range: { min: 3, max: 4 }, name: "대성공", replace: true },
      { range: { min: 17, max: 17 }, name: "실패", replace: true },
      { range: { min: 18, max: 18 }, name: "대실패", replace: true },
    ]);
  });

  it.each([
    ["Fate", FATE, ["기술", "상대"]],
    ["던전월드", DUNGEON_WORLD, ["능력치"]],
  ])("%s 식도 읽는다", (_system, definition, slotNames) => {
    const result = parseMacro(definition);

    expect(result.ok && result.macro.slots.map((slot) => slot.name)).toStrictEqual(slotNames);
  });

  it("결과 이름과 눈 효과가 없는 식은 빈칸만 가진다", () => {
    expect(parseMacro("{개수:1..5}d6")).toStrictEqual({
      ok: true,
      macro: {
        template: "{개수:1..5}d6",
        slots: [{ name: "개수", min: 1, max: 5 }],
        outcomes: [],
        effects: [],
      },
    });
  });

  it.each([
    ["닫히지 않은 빈칸", "d6+{능력치:1..4"],
    ["범위가 없는 빈칸", "d6+{능력치}"],
    ["겹치는 빈칸 이름", "d6+{a:1..2}+{a:1..2}"],
    ["최소 > 최대", "d6+{a:3..1}"],
    ["너무 많은 값", "d6+{a:0..100}"],
    ["최솟값으로 채우면 틀린 표기", "{개수:0..3}d6"],
    ["틀린 표기", "2x6 => 0 실패"],
    ["겹치는 결과 범위", "2d6 => ..7 실패 | 7.. 성공"],
    ["겹치는 눈 범위", "d20 ; 1..2 a, 2 b"],
    ["범위가 없는 결과", "2d6 => 실패"],
    ["끝이 없는 범위", "2d6 => .. 실패"],
    ["이름이 없는 결과", "2d6 => 0"],
    ["쓸 수 없는 글자", "2d6 => ..6 실패, 대실패"],
    ["141자 결과 이름", `2d6 => 0 ${"가".repeat(141)}`],
  ])("%s는 오류다: %s", (_name, definition) => {
    expect(parseMacro(definition).ok).toBe(false);
  });
});

/** 올바른 식만 쓰는 테스트에서 읽은 매크로를 꺼낸다 */
const macroOf = (definition: string): ParsedMacro => {
  const result = parseMacro(definition);
  if (!result.ok) throw new Error(result.message);
  return result.macro;
};

describe("빈칸 채우기", () => {
  it.each([
    [IRONSWORN, { 능력치: 2, 수정치: 1 }, "d6+2+1 max10 > 2d10"],
    [CYPHER, { 난이도: 3 }, "d20 >= 3*3"],
    [DUNGEON_WORLD, { 능력치: -1 }, "2d6-1"],
    ["2d6-{a:-2..2}", { a: -2 }, "2d6+2"],
  ])("%s에 %j를 채우면 %s다", (definition, values, notation) => {
    expect(fillMacro(macroOf(definition), values)).toStrictEqual({ ok: true, notation });
  });

  it.each([
    ["빠진 빈칸", { 능력치: 2 }],
    ["범위 밖", { 능력치: 5, 수정치: 0 }],
    ["정수가 아님", { 능력치: 1.5, 수정치: 0 }],
  ])("%s은 오류다", (_name, values) => {
    expect(fillMacro(macroOf(IRONSWORN), values).ok).toBe(false);
  });
});

/** 결과 이름을 고르는 데 쓰는 값만 채운 판정 값 */
const judged = (value: number, natural: number): Judgement => ({
  score: 0,
  value,
  match: false,
  natural,
});

describe("결과 이름과 눈 효과", () => {
  it.each([
    [IRONSWORN, judged(1, 3), { outcome: "약한 성공" }],
    [DUNGEON_WORLD, judged(6, 7), { outcome: "실패" }],
    [DUNGEON_WORLD, judged(10, 9), { outcome: "강한 성공" }],
    [FATE, judged(0, 0), { outcome: "동점" }],
    [CYPHER, judged(11, 20), { outcome: "성공", effect: "큰 이득" }],
    [CYPHER, judged(-8, 1), { outcome: "실패", effect: "마스터 개입" }],
    [CYPHER, judged(1, 10), { outcome: "성공" }],
    // !는 결과 이름을 바꾼다
    [GURPS, judged(5, 4), { outcome: "대성공" }],
    [GURPS, judged(-6, 18), { outcome: "대실패" }],
    [GURPS, judged(0, 17), { outcome: "실패" }],
    [GURPS, judged(-10, 13), { outcome: "대실패" }],
    // 맞는 범위가 없으면 이름이 없다
    ["2d6 => 2..5 보통", judged(12, 12), {}],
  ])("%s에서 %j는 %j다", (definition, judgement, names) => {
    expect(nameResult(macroOf(definition), judgement)).toStrictEqual(names);
  });
});
