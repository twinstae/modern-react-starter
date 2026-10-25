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
      "1번 · 열쇠 1",
      "2번 · 열쇠 2",
      "3번 · 열쇠 3",
      "4번 · 열쇠 4",
      "5번 · 열쇠 5",
      "6번 · 열쇠 6",
      "7번 · 열쇠 7",
    ]);
    expect(SEED_QUESTION_SET.drawers.map(({ reason }) => reason)).toStrictEqual([
      "바꾸고 싶은 마음에는 작은 습관부터 건드리는 책이 잘 맞아요.",
      "나를 들여다보고 싶은 날에는 천천히 자신에게 말을 거는 책을 권해요.",
      "세상이 답답할 때는 그 구조를 함께 들여다보는 책이 좋아요.",
      "가까운 사람과의 거리가 고민될 때 관계를 다시 그려 보는 책이 도움이 돼요.",
      "잠시 멈추고 싶을 때는 곁에 오래 두고 읽는 책이 잘 어울려요.",
      "다른 삶이 궁금할 때는 내가 모르던 사람의 하루를 만나는 책을 권해요.",
      "세계를 넓히고 싶을 때는 역사와 과학을 건너오는 책이 좋아요.",
    ]);
    expect(SEED_QUESTION_SET.baselines).toStrictEqual([
      {
        name: "서윤",
        answers: [5, 4, 2, 3, 2, 2, 2, 3, 4, 2, 1, 1, 2, 2],
        expected: { first: "B6", second: "B1" },
      },
    ]);
  });

  it("서랍마다 부록 B의 핵심 단어를 가진다", () => {
    expect(SEED_QUESTION_SET.drawers.map(({ keywords }) => [...keywords])).toStrictEqual([
      ["일", "생활", "실천", "변화"],
      ["나", "마음", "정체성", "취향", "삶"],
      ["계급", "불평등", "노동", "정치", "제도"],
      ["가족", "친구", "사랑", "거리", "관계"],
      ["철학", "사유", "예술", "관찰"],
      ["타인", "경험", "노동", "다양한 삶"],
      ["역사", "문화", "과학", "환경", "문명"],
    ]);
  });

  it("손님에게 보이는 시드 문구에 편집용 표시가 없다", () => {
    const publicTexts = [
      ...SEED_QUESTION_SET.questions.map(({ text }) => text),
      ...SEED_QUESTION_SET.drawers.flatMap(({ name, mark, reason, statement }) => [
        name,
        mark,
        reason,
        statement,
      ]),
    ].filter((text): text is string => text !== null);

    for (const text of publicTexts) {
      expect(text).not.toMatch(/\[가정\]|TODO|TBD|상태입니다|이어집니다|그 마음이/);
    }
  });

  it("상태 문장과 인용 문형을 질문 세트 데이터로 가진다", () => {
    expect(SEED_QUESTION_SET.statementTemplate).toBe(
      "{nickname} 님에겐 지금, {drawer:이/가} 필요해 보여요",
    );
    expect(SEED_QUESTION_SET.secondStatementTemplate).toBe("{drawer:이/가} 함께 보이면 좋겠어요");
    expect(SEED_QUESTION_SET.citationTemplates).toStrictEqual({
      item: "‘{quote}’라고 하셨죠",
      choice: "‘{quote}’를 고르셨어요",
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
