import { describe, expect, it } from "vite-plus/test";

import { SAMPLE_SIZE, analyze } from "./analyze.ts";
import { seededRng } from "./random.ts";
import { SEED_QUESTION_SET, SEED_RANDOM_SEED } from "./seed-question-set.ts";

describe("MVP 시드 질문 세트", () => {
  it("서랍 7개에 문항 2개씩이고 기준 응답이 서윤의 B6·B1이다", () => {
    expect(SEED_QUESTION_SET.drawers.map(({ code }) => code)).toStrictEqual([
      "B6",
      "B1",
      "B4",
      "B2",
      "B7",
      "B3",
      "B5",
    ]);
    expect(
      SEED_QUESTION_SET.drawers.map(({ code }) => ({
        drawer: code,
        items: SEED_QUESTION_SET.questions.filter(
          (question) => question.type === "item" && question.drawer === code,
        ).length,
      })),
    ).toStrictEqual(SEED_QUESTION_SET.drawers.map(({ code }) => ({ drawer: code, items: 2 })));
    expect(SEED_QUESTION_SET.drawers.map(({ mark }) => mark)).toStrictEqual([
      "[가정] 1번 · 열쇠 1",
      "[가정] 2번 · 열쇠 2",
      "[가정] 3번 · 열쇠 3",
      "[가정] 4번 · 열쇠 4",
      "[가정] 5번 · 열쇠 5",
      "[가정] 6번 · 열쇠 6",
      "[가정] 7번 · 열쇠 7",
    ]);
    expect(SEED_QUESTION_SET.baselines).toStrictEqual([
      {
        name: "서윤",
        answers: [5, 4, 2, 3, 2, 2, 2, 3, 4, 2, 1, 1, 2, 2],
        expected: { first: "B6", second: "B1" },
      },
    ]);
  });

  it("상태 문장과 인용 문형을 질문 세트 데이터로 가진다", () => {
    expect(SEED_QUESTION_SET.statementTemplate).toBe(
      "{nickname} 님에게는 지금 {drawer:이/가} 필요한 상태입니다",
    );
    expect(SEED_QUESTION_SET.citationTemplates).toStrictEqual({
      item: "‘{quote}’에 그렇다고 답하신",
      choice: "‘{quote}’를 고르신",
    });
  });

  it("시드 점검은 매번 같은 보고를 낸다", () => {
    expect(analyze(SEED_QUESTION_SET, seededRng(SEED_RANDOM_SEED))).toStrictEqual(
      analyze(SEED_QUESTION_SET, seededRng(SEED_RANDOM_SEED)),
    );
  });

  it("공개 점검을 통과하고 서랍별 1순위 비율이 10~18% 안이다", () => {
    const report = analyze(SEED_QUESTION_SET, seededRng(SEED_RANDOM_SEED));

    expect(report.sampleSize).toBe(SAMPLE_SIZE);
    expect(report.gate).toStrictEqual({ passed: true, failures: [], warnings: [] });
    expect(report.structure.balanced).toBe(true);
    expect(report.structure.emptyDrawers).toStrictEqual([]);
    expect(report.structure.baselines[0]?.matches).toBe(true);
    expect(
      report.sample.byDrawer.map(({ drawer, firstCount, firstRate }) => ({
        drawer,
        firstCount,
        firstRate,
      })),
    ).toStrictEqual([
      { drawer: "B6", firstCount: 715, firstRate: 0.17875 },
      { drawer: "B1", firstCount: 651, firstRate: 0.16275 },
      { drawer: "B4", firstCount: 626, firstRate: 0.1565 },
      { drawer: "B2", firstCount: 575, firstRate: 0.14375 },
      { drawer: "B7", firstCount: 547, firstRate: 0.13675 },
      { drawer: "B3", firstCount: 445, firstRate: 0.11125 },
      { drawer: "B5", firstCount: 441, firstRate: 0.11025 },
    ]);
  });
});
