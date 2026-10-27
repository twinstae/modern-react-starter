import { describe, expect, it } from "vite-plus/test";

import { SAMPLE_SIZE, analyze } from "./analyze.ts";
import { curate } from "./curate.ts";
import { seededRng } from "./random.ts";
import { SEED_DRAWERS, SEED_QUESTION_SET, SEED_RANDOM_SEED } from "./seed-question-set.ts";

describe("시드 서랍", () => {
  it("서랍 7개에 문항 2개씩과 책 3권씩을 둔다", () => {
    expect(
      SEED_DRAWERS.map(({ id, questions, books }) => [id, questions.length, books.length]),
    ).toStrictEqual([
      ["B6", 2, 3],
      ["B1", 2, 3],
      ["B4", 2, 3],
      ["B2", 2, 3],
      ["B7", 2, 3],
      ["B3", 2, 3],
      ["B5", 2, 3],
    ]);
  });

  it("손님에게 보이는 시드 문구에 편집용 표시가 없다", () => {
    for (const text of SEED_DRAWERS.flatMap(({ name, questions }) => [name, ...questions])) {
      expect(text).not.toMatch(/\[가정\]|TODO|TBD/);
    }
  });

  it("B6 문항에 가장 높게, B1 문항에 그다음으로 답하면 B6·B1이다", () => {
    const answers = SEED_QUESTION_SET.questions.map(({ drawer }) =>
      drawer === "B6" ? 5 : drawer === "B1" ? 4 : 2,
    );

    expect(curate(SEED_QUESTION_SET, answers, "토끼").ranking).toStrictEqual({
      first: "B6",
      second: "B1",
      similar: false,
    });
  });

  it("공개 점검을 매번 같게 통과하고, 서랍마다 문항이 2개라 첫 서랍이 쏠림 기준에 붙는다", () => {
    const report = analyze(SEED_QUESTION_SET, seededRng(SEED_RANDOM_SEED));

    expect(report).toStrictEqual(analyze(SEED_QUESTION_SET, seededRng(SEED_RANDOM_SEED)));
    expect(report.sampleSize).toBe(SAMPLE_SIZE);
    expect(report.gate).toStrictEqual({
      passed: true,
      failures: [],
      warnings: [{ code: "sample-skew", drawers: ["B6"] }],
    });
  });
});
