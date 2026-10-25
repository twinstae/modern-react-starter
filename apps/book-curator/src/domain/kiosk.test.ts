import { describe, expect, it } from "vite-plus/test";

import {
  parseKioskCurrent,
  toKioskCurrentDto,
  toPublicQuestionSetDto,
  toPublicShelfDto,
} from "./kiosk.ts";
import { SEED_QUESTION_SET } from "./seed-question-set.ts";
import { SHELF_BOOKS, SHELF_STOCK } from "./shelf.fixture.ts";

describe("키오스크 묶음", () => {
  it("공개 버전이 없으면 준비 중이다", () => {
    expect(toKioskCurrentDto(null)).toStrictEqual({ status: "preparing" });
    expect(parseKioskCurrent({ status: "preparing" })).toStrictEqual({ status: "preparing" });
  });

  it("공개 질문 세트에서 관리자용 기준 응답만 빼고 서랍 표시·이유는 보낸다", () => {
    const publicSet = toPublicQuestionSetDto(SEED_QUESTION_SET);

    expect(publicSet).not.toHaveProperty("baselines");
    expect(publicSet.drawers).toStrictEqual(
      SEED_QUESTION_SET.drawers.map(({ code, name, order, statement, mark, reason }) => ({
        code,
        name,
        order,
        statement,
        mark,
        reason,
      })),
    );
    expect(publicSet.drawers.map(({ mark }) => mark)).toStrictEqual(
      SEED_QUESTION_SET.drawers.map(({ mark }) => mark),
    );
    expect(publicSet.drawers.map(({ reason }) => reason)).toStrictEqual(
      SEED_QUESTION_SET.drawers.map(({ reason }) => reason),
    );
  });

  it("서랍마다 책과 수량을 보내고, 수량 0도 남기며 관련도는 넣지 않는다", () => {
    const shelf = toPublicShelfDto(SEED_QUESTION_SET, {
      stock: SHELF_STOCK,
      books: SHELF_BOOKS,
    });

    expect(shelf.drawers.map(({ drawer }) => drawer)).toStrictEqual(
      SEED_QUESTION_SET.drawers.map(({ code }) => code),
    );
    const b6 = shelf.drawers.find(({ drawer }) => drawer === "B6");
    if (b6 === undefined) throw new Error("B6 서랍이 있어야 합니다");
    expect(b6.books).toStrictEqual([
      {
        bookId: "book-b6-1",
        title: "삶을 바꾸는 연습",
        author: "김연습",
        reason: "이 책을 지금 건네고 싶은 이유",
        question: "이 책을 읽고 함께 생각해 볼 질문",
        quantity: 2,
      },
      {
        bookId: "book-b6-2",
        title: "하루의 구조",
        author: "박구조",
        reason: "이 책을 지금 건네고 싶은 이유",
        question: "이 책을 읽고 함께 생각해 볼 질문",
        quantity: 1,
      },
      {
        bookId: "book-b6-3",
        title: "작은 실험",
        author: "이실험",
        reason: "이 책을 지금 건네고 싶은 이유",
        question: "이 책을 읽고 함께 생각해 볼 질문",
        quantity: 1,
      },
    ]);
    expect(b6.books.some((book) => "relevance" in book)).toBe(false);
  });

  it("공개 묶음을 받으면 기준 응답이 빈 질문 세트와 서가로 파싱한다", () => {
    const bundle = parseKioskCurrent(
      toKioskCurrentDto({ version: 2, questionSet: SEED_QUESTION_SET }),
    );

    expect(bundle.status).toBe("ready");
    if (bundle.status !== "ready") throw new Error("준비된 묶음이어야 합니다");
    expect(bundle.version).toBe(2);
    expect(bundle.questionSet.questions).toStrictEqual(SEED_QUESTION_SET.questions);
    expect(bundle.questionSet.drawers).toStrictEqual(
      SEED_QUESTION_SET.drawers.map((drawer) => drawer),
    );
    expect(bundle.questionSet.baselines).toStrictEqual([]);
    expect(bundle.shelf).toStrictEqual({
      drawers: SEED_QUESTION_SET.drawers.map(({ code }) => ({ drawer: code, books: [] })),
    });
  });

  it("응답 모양에 모르는 필드가 있으면 거부한다", () => {
    expect(() =>
      parseKioskCurrent({
        status: "ready",
        version: 1,
        questionSet: toPublicQuestionSetDto(SEED_QUESTION_SET),
        shelf: { drawers: [] },
        nickname: "토끼",
      }),
    ).toThrow();
  });
});
