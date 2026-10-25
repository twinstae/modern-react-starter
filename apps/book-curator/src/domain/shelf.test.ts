import { describe, expect, it } from "vite-plus/test";

import { parseQuestionSet } from "./question-set.ts";
import { SEOYUN_SET_INPUT } from "./seoyun.fixture.ts";
import { SHELF_STOCK } from "./shelf.fixture.ts";
import { checkShelfGate, MissingBookError, parseDrawerStock, shelfKinds } from "./shelf.ts";

const drawers = parseQuestionSet(SEOYUN_SET_INPUT).drawers;

describe("checkShelfGate", () => {
  it("서랍마다 수량 1 이상인 책이 3종 이상이면 통과한다", () => {
    const stock = SHELF_STOCK.filter(({ drawer }) => drawer === "B6");
    const onlyB6 = drawers.filter(({ code }) => code === "B6");

    expect(checkShelfGate(stock, onlyB6)).toStrictEqual({ passed: true, lacking: [] });
    expect(shelfKinds(stock, "B6")).toBe(3);
  });

  it("3종 미만인 서랍을 이름과 현재 종류 수와 함께 돌려준다(I-7)", () => {
    expect(checkShelfGate(SHELF_STOCK, drawers)).toStrictEqual({
      passed: false,
      lacking: [
        { drawer: "B1", name: "나를 들여다보는 책", kinds: 1 },
        { drawer: "B2", name: "관계를 다시 생각하는 책", kinds: 1 },
      ],
    });
  });

  it("수량 0인 책은 종류로 세지 않는다", () => {
    const stock = parseDrawerStock([
      { drawer: "B6", bookId: "book-a", quantity: 1 },
      { drawer: "B6", bookId: "book-b", quantity: 1 },
      { drawer: "B6", bookId: "book-c", quantity: 0 },
    ]);

    expect(shelfKinds(stock, "B6")).toBe(2);
  });

  it("서랍 속 책이 하나도 없는 서랍도 부족한 서랍이다", () => {
    expect(
      checkShelfGate([], drawers).lacking.map(({ drawer, kinds }) => ({ drawer, kinds })),
    ).toStrictEqual([
      { drawer: "B6", kinds: 0 },
      { drawer: "B1", kinds: 0 },
      { drawer: "B2", kinds: 0 },
    ]);
  });
});

describe("DrawerStockEntry", () => {
  it("수량은 0 이상의 정수만 받고, 같은 서랍에 같은 책을 두 번 두지 않는다", () => {
    expect(() => parseDrawerStock([{ drawer: "B6", bookId: "book-a", quantity: -1 }])).toThrow();
    expect(() => parseDrawerStock([{ drawer: "B6", bookId: "book-a", quantity: 1.5 }])).toThrow();
    expect(() =>
      parseDrawerStock([
        { drawer: "B6", bookId: "book-a", quantity: 1 },
        { drawer: "B6", bookId: "book-a", quantity: 2 },
      ]),
    ).toThrow();
  });
});

describe("MissingBookError", () => {
  it("서가에 없는 책 id를 이름 있는 오류로 남긴다", () => {
    const error = new MissingBookError("book-x", "B6");

    expect(error.name).toBe("MissingBookError");
    expect(error.bookId).toBe("book-x");
    expect(error.drawer).toBe("B6");
  });
});
