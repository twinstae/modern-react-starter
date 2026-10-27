import { describe, expect, it } from "vite-plus/test";

import { SAMPLE_SIZE, analyze, firstRateRange } from "./analyze.ts";
import { parseQuestionSet, type DrawerId } from "./question-set.ts";
import { seededRng } from "./random.ts";
import { SEOYUN_SET_INPUT } from "./seoyun.fixture.ts";

const CODES = ["B1", "B2", "B3", "B4", "B5", "B6", "B7"] as const satisfies readonly DrawerId[];

const NAMES: Record<DrawerId, string> = {
  B1: "나를 들여다보는 책",
  B2: "관계를 다시 생각하는 책",
  B3: "다른 삶을 만나는 책",
  B4: "사회를 이해하는 책",
  B5: "세계를 넓혀 보는 책",
  B6: "삶의 방식을 바꾸는 책",
  B7: "잠시 멈춰 생각하는 책",
};

const balancedSet = () =>
  parseQuestionSet({
    drawers: CODES.map((code) => ({ id: code, name: NAMES[code] })),
    questions: CODES.flatMap((code) => [
      { drawer: code, text: `${NAMES[code]} 1` },
      { drawer: code, text: `${NAMES[code]} 2` },
    ]),
  });

describe("analyze 표본", () => {
  it("같은 시드 난수로 두 번 점검하면 같은 보고가 나온다", () => {
    const set = balancedSet();

    expect(analyze(set, seededRng(79))).toStrictEqual(analyze(set, seededRng(79)));
  });

  it("표본은 고정 크기이고 서랍별 1순위·1·2순위 비율과 동점·비슷함 비율을 센다", () => {
    const report = analyze(balancedSet(), seededRng(79));

    expect(report.sampleSize).toBe(SAMPLE_SIZE);
    expect(report.sample.samples).toBe(SAMPLE_SIZE);
    expect(report.sample.decidedCount).toBe(SAMPLE_SIZE);
    expect(report.sample.undecidedCount).toBe(0);
    expect(report.sample.byDrawer).toHaveLength(CODES.length);
    expect(report.sample.byDrawer.map(({ drawer }) => drawer)).toStrictEqual([...CODES]);

    expect(report.sample.byDrawer.reduce((sum, { firstCount }) => sum + firstCount, 0)).toBe(
      SAMPLE_SIZE,
    );
    expect(report.sample.byDrawer.reduce((sum, { topTwoCount }) => sum + topTwoCount, 0)).toBe(
      SAMPLE_SIZE * 2,
    );

    for (const { firstCount, firstRate, topTwoCount, topTwoRate } of report.sample.byDrawer) {
      expect(firstRate).toBe(firstCount / SAMPLE_SIZE);
      expect(topTwoRate).toBe(topTwoCount / SAMPLE_SIZE);
      expect(firstRate).toBeGreaterThanOrEqual(firstRateRange(7).min);
      expect(firstRate).toBeLessThanOrEqual(firstRateRange(7).max);
    }

    expect(report.sample.tieBrokenByOrderRate).toBe(
      report.sample.tieBrokenByOrderCount / SAMPLE_SIZE,
    );
    expect(report.sample.similarRate).toBe(report.sample.similarCount / SAMPLE_SIZE);
    expect(report.gate).toStrictEqual({ passed: true, failures: [], warnings: [] });
  });

  it("서랍마다 문항이 하나뿐이면 동점이 앞 서랍에 몰려 쏠림을 경고한다", () => {
    const report = analyze(
      parseQuestionSet({
        drawers: [
          { id: "B1", name: NAMES.B1 },
          { id: "B2", name: NAMES.B2 },
          { id: "B3", name: NAMES.B3 },
        ],
        questions: [
          { drawer: "B1", text: "가" },
          { drawer: "B2", text: "나" },
          { drawer: "B3", text: "다" },
        ],
      }),
      seededRng(79),
    );

    expect(report.gate).toStrictEqual({
      passed: true,
      failures: [],
      warnings: [{ code: "sample-skew", drawers: ["B1"] }],
    });
  });
});

describe("analyze 구조", () => {
  it("문항 수가 서랍마다 다르면 경고하고 부족한 서랍을 알린다", () => {
    const report = analyze(
      parseQuestionSet({
        drawers: [
          { id: "B1", name: NAMES.B1 },
          { id: "B2", name: NAMES.B2 },
        ],
        questions: [
          { drawer: "B1", text: "가" },
          { drawer: "B1", text: "나" },
          { drawer: "B2", text: "다" },
        ],
      }),
      seededRng(79),
    );

    expect(report.structure.drawers).toStrictEqual([
      { drawer: "B1", itemCount: 2 },
      { drawer: "B2", itemCount: 1 },
    ]);
    expect(report.structure.itemCountImbalance).toBe(1);
    expect(report.structure.balanced).toBe(false);
    expect(report.structure.emptyDrawers).toStrictEqual([]);
    expect(report.gate.warnings).toContainEqual({
      code: "item-count-imbalance",
      drawers: ["B2"],
    });
  });

  it("문항이 없는 서랍을 실패로 보고한다", () => {
    const report = analyze(
      parseQuestionSet({
        drawers: [
          { id: "B1", name: NAMES.B1 },
          { id: "B2", name: NAMES.B2 },
          { id: "B3", name: NAMES.B3 },
        ],
        questions: [
          { drawer: "B1", text: "가" },
          { drawer: "B2", text: "나" },
        ],
      }),
      seededRng(79),
    );

    expect(report.structure.emptyDrawers).toStrictEqual(["B3"]);
    expect(report.gate.failures).toContainEqual({
      code: "empty-drawer",
      drawers: ["B3"],
    });
  });
});

describe("analyze 쌓인 응답", () => {
  it("쌓인 응답을 넘기면 표본과 나란히 같은 지표를 낸다", () => {
    const set = parseQuestionSet(SEOYUN_SET_INPUT);
    const report = analyze(set, seededRng(79), [
      [5, 4, 2, 4, 3],
      [4, 5, 2, 3, 4],
      [1, 1, 5, 1, 1],
    ]);

    expect(report.recorded?.samples).toBe(3);
    expect(report.recorded?.decidedCount).toBe(3);
    expect(report.recorded?.byDrawer).toStrictEqual([
      { drawer: "B6", firstCount: 1, firstRate: 1 / 3, topTwoCount: 3, topTwoRate: 1 },
      { drawer: "B1", firstCount: 1, firstRate: 1 / 3, topTwoCount: 2, topTwoRate: 2 / 3 },
      { drawer: "B2", firstCount: 1, firstRate: 1 / 3, topTwoCount: 1, topTwoRate: 1 / 3 },
    ]);
  });

  it("쌓인 응답이 부분 답이어도 기존 코어로 채점해 센다", () => {
    const report = analyze(parseQuestionSet(SEOYUN_SET_INPUT), seededRng(79), [[5, 4]]);

    expect(report.recorded?.samples).toBe(1);
    expect(report.recorded?.byDrawer[0]).toStrictEqual({
      drawer: "B6",
      firstCount: 1,
      firstRate: 1,
      topTwoCount: 1,
      topTwoRate: 1,
    });
  });

  it("쌓인 응답을 넘기지 않으면 보고에 그 자리가 없다", () => {
    expect(analyze(parseQuestionSet(SEOYUN_SET_INPUT), seededRng(79)).recorded).toBeUndefined();
  });

  it("쌓인 응답이 비어 있으면 분포만 0이고 쏠림 경고는 없다", () => {
    const report = analyze(parseQuestionSet(SEOYUN_SET_INPUT), seededRng(79), []);

    expect(report.recorded?.samples).toBe(0);
    expect(report.gate.warnings).not.toContainEqual(
      expect.objectContaining({ code: "recorded-skew" }),
    );
  });
});
