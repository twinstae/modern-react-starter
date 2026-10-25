import { describe, expect, it } from "vite-plus/test";

import { drawerOrder, parseQuestionSet, type DrawerCode } from "./question-set.ts";
import { rank } from "./rank.ts";
import { scoreItemMean } from "./scoring/item-mean.ts";
import { parseDrawerScores } from "./scoring/index.ts";

const scores = (...entries: [DrawerCode, number, number][]) =>
  parseDrawerScores({
    scoring: "item-mean",
    drawers: entries.map(([drawer, score, fives]) => ({
      drawer,
      score,
      fives,
      contributions: [],
    })),
  });

describe("rank", () => {
  it("점수가 가장 높은 서랍이 1순위, 다음이 2순위다", () => {
    expect(
      rank(scores(["B6", 4.5, 1], ["B1", 3.5, 0], ["B2", 2, 0]), ["B1", "B2", "B6"]),
    ).toStrictEqual({ first: "B6", second: "B1", similar: false });
  });

  it("동점이면 유효한 5가 많은 서랍이 먼저다", () => {
    expect(rank(scores(["B2", 4.333, 1], ["B1", 4.333, 2]), ["B2", "B1"])).toStrictEqual({
      first: "B1",
      second: "B2",
      similar: true,
    });
  });

  it("5의 수까지 같으면 관리자가 정한 서랍 순서를 따른다", () => {
    expect(rank(scores(["B1", 4, 0], ["B2", 4, 0]), ["B2", "B1"])).toStrictEqual({
      first: "B2",
      second: "B1",
      similar: true,
    });
  });

  it("서랍 순서는 동점일 때만 쓰고, 점수가 낮은 서랍을 앞세우지 않는다", () => {
    expect(rank(scores(["B2", 3, 0], ["B1", 4, 0]), ["B2", "B1"]).first).toBe("B1");
  });

  it("1·2순위 점수가 가까우면 비슷함을 표시하되 순위는 그대로다", () => {
    const close = rank(scores(["B6", 4.5, 0], ["B1", 4.2, 0]), ["B1", "B6"]);

    expect(close).toStrictEqual({ first: "B6", second: "B1", similar: true });
    expect(rank(scores(["B6", 4.5, 0], ["B1", 3.4, 0]), ["B1", "B6"]).similar).toBe(false);
  });

  it("순위는 채점 방식 이름이나 기여한 답이 아니라 점수만 본다(I-6)", () => {
    const itemMean = scores(["B6", 4.5, 1], ["B1", 3.5, 0]);
    const learned = parseDrawerScores({
      scoring: "learned",
      drawers: itemMean.drawers.map((drawer) => ({
        ...drawer,
        contributions: [{ question: 0, drawer: drawer.drawer, answer: 5, value: drawer.score }],
      })),
    });

    expect(rank(learned, ["B1", "B6"])).toStrictEqual(rank(itemMean, ["B1", "B6"]));
  });

  it("실제 채점에서 점수가 같으면 5의 수로 깬다", () => {
    const set = parseQuestionSet({
      drawers: [
        { code: "B2", name: "관계를 다시 생각하는 책", order: 0 },
        { code: "B1", name: "나를 들여다보는 책", order: 1 },
      ],
      questions: [
        { type: "item", drawer: "B2", reversed: false, text: "관계를 생각한다" },
        { type: "item", drawer: "B2", reversed: false, text: "사람이 궁금하다" },
        { type: "item", drawer: "B2", reversed: false, text: "거리를 두고 싶다" },
        { type: "item", drawer: "B1", reversed: false, text: "나를 들여다본다" },
        { type: "item", drawer: "B1", reversed: false, text: "내 마음이 궁금하다" },
        { type: "item", drawer: "B1", reversed: false, text: "내가 어떤 사람인지 안다" },
      ],
      scoring: { type: "item-mean" },
    });

    expect(rank(scoreItemMean(set, [5, 4, 4, 5, 5, 3]), drawerOrder(set))).toStrictEqual({
      first: "B1",
      second: "B2",
      similar: true,
    });
  });

  it("실제 채점에서 점수와 5의 수가 같으면 서랍 순서로 깬다", () => {
    const set = parseQuestionSet({
      drawers: [
        { code: "B2", name: "관계를 다시 생각하는 책", order: 0 },
        { code: "B1", name: "나를 들여다보는 책", order: 1 },
      ],
      questions: [
        { type: "item", drawer: "B2", reversed: false, text: "관계를 생각한다" },
        { type: "item", drawer: "B1", reversed: false, text: "나를 들여다본다" },
      ],
      scoring: { type: "item-mean" },
    });

    expect(rank(scoreItemMean(set, [4, 4]), drawerOrder(set))).toStrictEqual({
      first: "B2",
      second: "B1",
      similar: true,
    });
  });
});
