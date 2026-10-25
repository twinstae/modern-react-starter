import { expectTypeOf } from "vite-plus/test";
import { describe, expect, it } from "vite-plus/test";

import { curate } from "./curate.ts";
import type { Book, ShelfBook } from "./book.ts";
import {
  drawerBooksView,
  ownerView,
  type DrawerBookView,
  type OwnerBookView,
  type OwnerView,
} from "./owner-view.ts";
import { parseQuestionSet } from "./question-set.ts";
import { SEOYUN_ANSWERS, SEOYUN_SET_INPUT } from "./seoyun.fixture.ts";
import { SHELF_BOOKS, SHELF_STOCK } from "./shelf.fixture.ts";
import { MissingBookError, parseDrawerStock } from "./shelf.ts";

const curation = curate(parseQuestionSet(SEOYUN_SET_INPUT), SEOYUN_ANSWERS, "토끼");
const view = ownerView(curation, SHELF_STOCK, SHELF_BOOKS);

describe("ownerView", () => {
  it("추천·2순위 서랍의 상태 문장과 책·수량, 비슷함, 모든 서랍을 담는다", () => {
    expect(view.recommended.drawer).toBe("B6");
    expect(view.recommended.name).toBe("삶의 방식을 바꾸는 책");
    expect(view.recommended.mark).toBeNull();
    expect(view.recommended.statement).toBe(
      "토끼 님에겐 지금, 삶의 방식을 바꾸는 책이 필요해 보여요",
    );
    expect(view.recommended.books).toStrictEqual([
      { bookId: "book-b6-1", title: "삶을 바꾸는 연습", author: "김연습", quantity: 2 },
      { bookId: "book-b6-2", title: "하루의 구조", author: "박구조", quantity: 1 },
      { bookId: "book-b6-3", title: "작은 실험", author: "이실험", quantity: 1 },
    ]);
    expect(view.recommended.kinds).toBe(3);
    expect(view.recommended.belowMinimum).toBe(false);

    expect(view.second.drawer).toBe("B1");
    expect(view.second.statement).toBe("나를 들여다보는 책이 함께 보이면 좋겠어요");
    expect(view.similar).toBe(false);
  });

  it("3종 미만인 서랍은 이름과 현재 종류 수를 담아 경고한다(I-7)", () => {
    expect(view.gate).toStrictEqual({
      passed: false,
      lacking: [
        { drawer: "B1", name: "나를 들여다보는 책", kinds: 1 },
        { drawer: "B2", name: "관계를 다시 생각하는 책", kinds: 1 },
      ],
    });
    expect(view.second.kinds).toBe(1);
    expect(view.second.belowMinimum).toBe(true);
  });

  it("수량 0인 책도 주인 목록에 남는다(R-9)", () => {
    expect(view.second.books).toStrictEqual([
      { bookId: "book-b1-1", title: "나를 보는 시간", author: "정보기", quantity: 1 },
      { bookId: "book-b1-2", title: "마음의 지도", author: "한마음", quantity: 0 },
    ]);
  });

  it("주인이 다른 서랍을 고를 수 있게 모든 서랍을 순서대로 담는다", () => {
    expect(view.drawers.map(({ drawer, name }) => ({ drawer, name }))).toStrictEqual([
      { drawer: "B6", name: "삶의 방식을 바꾸는 책" },
      { drawer: "B1", name: "나를 들여다보는 책" },
      { drawer: "B2", name: "관계를 다시 생각하는 책" },
    ]);
    expect(view.drawers.find(({ drawer }) => drawer === "B2")?.books).toStrictEqual([
      { bookId: "book-b2-1", title: "관계의 거리", author: "최거리", quantity: 1 },
    ]);
  });

  it("점수 숫자를 보이지 않는다", () => {
    expect(JSON.stringify(view)).not.toMatch(/"score"|"scores"/);

    expectTypeOf<keyof OwnerView>().toEqualTypeOf<
      "recommended" | "second" | "similar" | "drawers" | "gate"
    >();
    expectTypeOf<keyof OwnerBookView>().toEqualTypeOf<"bookId" | "title" | "author" | "quantity">();
  });

  it("서랍 속 책이 서가에 없으면 이름 있는 오류로 멈춘다", () => {
    const stock = parseDrawerStock([
      ...SHELF_STOCK,
      { drawer: "B6", bookId: "book-x", quantity: 1 },
    ]);

    expect(() => ownerView(curation, stock, SHELF_BOOKS)).toThrow(MissingBookError);
    expect(() => ownerView(curation, stock, SHELF_BOOKS)).toThrow("book-x");
  });

  it("공개 서가의 최소 책(ShelfBook)만으로 view를 만든다", () => {
    const shelfBooks: ShelfBook[] = SHELF_BOOKS.map(({ id, title, author, reason, question }) => ({
      id,
      title,
      author,
      reason,
      question,
    }));

    expect(ownerView(curation, SHELF_STOCK, shelfBooks).recommended.books).toHaveLength(3);
    expect(drawerBooksView({ code: "B6" }, SHELF_STOCK, shelfBooks)).toHaveLength(3);
    expectTypeOf<Book>().toMatchTypeOf<ShelfBook>();
  });
});

describe("drawerBooksView", () => {
  it("건넨 서랍의 책만 제목·저자·이유·질문·수량으로 보여 준다", () => {
    const books = drawerBooksView({ code: "B6" }, SHELF_STOCK, SHELF_BOOKS);

    expect(books).toStrictEqual([
      {
        title: "삶을 바꾸는 연습",
        author: "김연습",
        reason: "이 책을 지금 건네고 싶은 이유",
        question: "이 책을 읽고 함께 생각해 볼 질문",
        quantity: 2,
      },
      {
        title: "하루의 구조",
        author: "박구조",
        reason: "이 책을 지금 건네고 싶은 이유",
        question: "이 책을 읽고 함께 생각해 볼 질문",
        quantity: 1,
      },
      {
        title: "작은 실험",
        author: "이실험",
        reason: "이 책을 지금 건네고 싶은 이유",
        question: "이 책을 읽고 함께 생각해 볼 질문",
        quantity: 1,
      },
    ]);
  });

  it("수량 0인 책도 '없음'으로 남고 다른 서랍의 책은 없다(R-9, I-9)", () => {
    const books = drawerBooksView({ code: "B1" }, SHELF_STOCK, SHELF_BOOKS);

    expect(books.map(({ title, quantity }) => ({ title, quantity }))).toStrictEqual([
      { title: "나를 보는 시간", quantity: 1 },
      { title: "마음의 지도", quantity: 0 },
    ]);
    expect(JSON.stringify(books)).not.toContain("삶을 바꾸는 연습");
    expect(JSON.stringify(books)).not.toContain("관계의 거리");
  });

  it("손님 view model 타입에 서랍 코드·관련도·점수가 없다(I-9)", () => {
    expectTypeOf<keyof DrawerBookView>().toEqualTypeOf<
      "title" | "author" | "reason" | "question" | "quantity"
    >();
    expect(JSON.stringify(drawerBooksView({ code: "B6" }, SHELF_STOCK, SHELF_BOOKS))).not.toMatch(
      /\bB[1-7]\b/,
    );
    expect(JSON.stringify(drawerBooksView({ code: "B6" }, SHELF_STOCK, SHELF_BOOKS))).not.toMatch(
      /relevance|score/i,
    );
  });

  it("서랍 속 책이 서가에 없으면 이름 있는 오류로 멈춘다", () => {
    const stock = parseDrawerStock([{ drawer: "B6", bookId: "book-x", quantity: 0 }]);

    expect(() => drawerBooksView({ code: "B6" }, stock, SHELF_BOOKS)).toThrow(MissingBookError);
  });
});
