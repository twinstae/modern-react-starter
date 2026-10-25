import { describe, expect, it } from "vite-plus/test";

import { createApiClient } from "../api-client.ts";
import type { BookInput } from "../domain/book.ts";
import { SEED_QUESTION_SET } from "../domain/seed-question-set.ts";
import { SHELF_BOOKS, SHELF_STOCK } from "../domain/shelf.fixture.ts";
import {
  createMemoryBookStore,
  createMemoryDrawerStockStore,
} from "../persistence/memory-shelf-store.ts";
import { createMemoryPublishedQuestionSetStore } from "../persistence/memory-published-question-set-store.ts";
import { unwrap } from "../unwrap.ts";
import { createTestServer, signInOperator } from "./test-client.ts";

const BOOK_INPUT: BookInput = {
  title: "삶을 바꾸는 연습",
  author: "김연습",
  relevance: { B1: 4, B2: 1, B3: 2, B4: 1, B5: 0, B6: 5, B7: 3 },
  keywords: ["삶", "연습"],
  reason: "지금 삶의 방식을 조금씩 바꿔 보고 싶은 손님에게",
  question: "이번 주에 바꿔 볼 수 있는 작은 하나는 무엇인가요?",
};

async function signedInServer(options: { published?: boolean } = {}) {
  const publishedStore = createMemoryPublishedQuestionSetStore();
  if (options.published !== false) await publishedStore.publish(SEED_QUESTION_SET);

  const server = createTestServer({
    publishedQuestionSetStore: publishedStore,
    bookStore: createMemoryBookStore(),
    stockStore: createMemoryDrawerStockStore(),
  });
  const cookie = await signInOperator(server.auth);
  const admin = createApiClient(server.app, { headers: { cookie } });

  return { ...server, admin, cookie, publishedStore };
}

describe("운영자 책 API", () => {
  it("로그인하지 않으면 책·서가 API가 401이다", async () => {
    const { api } = createTestServer();

    expect((await api.admin.books.get()).status).toBe(401);
    expect((await api.admin.shelf.get()).status).toBe(401);
    expect(
      (await api.admin.drawers({ drawer: "B6" }).books({ bookId: "book-1" }).put({ quantity: 1 }))
        .status,
    ).toBe(401);
    expect((await api.admin.books.post(BOOK_INPUT)).status).toBe(401);
  });

  it("책을 추가하고 다시 불러오면 같으며, id는 서버가 만든다", async () => {
    const { admin } = await signedInServer();

    const created = await unwrap(admin.admin.books.post(BOOK_INPUT));
    expect(created.id).toBe("book-test-1");
    expect(created).toStrictEqual({ ...BOOK_INPUT, id: "book-test-1" });

    expect(await unwrap(admin.admin.books.get())).toStrictEqual([created]);
  });

  it("책을 고치면 같은 id로 덮어쓰고, 없는 책은 404다", async () => {
    const { admin } = await signedInServer();
    const created = await unwrap(admin.admin.books.post(BOOK_INPUT));
    const changed: BookInput = { ...BOOK_INPUT, title: "고친 제목", keywords: ["고침"] };

    expect(await unwrap(admin.admin.books({ id: created.id }).put(changed))).toStrictEqual({
      ...changed,
      id: created.id,
    });
    expect(await unwrap(admin.admin.books.get())).toStrictEqual([{ ...changed, id: created.id }]);

    const missing = await admin.admin.books({ id: "book-none" }).put(changed);
    expect(missing.status).toBe(404);
    expect(missing.error?.value).toStrictEqual({ code: "BOOK_NOT_FOUND" });
  });

  it("관련도는 0~5 정수만, 핵심 단어는 1개 이상 겹치지 않게 받는다", async () => {
    const { admin } = await signedInServer();

    expect(
      (
        await admin.admin.books.post({
          ...BOOK_INPUT,
          relevance: { ...BOOK_INPUT.relevance, B6: 6 },
        })
      ).status,
    ).toBe(422);
    expect(
      (
        await admin.admin.books.post({
          ...BOOK_INPUT,
          relevance: { ...BOOK_INPUT.relevance, B1: 1.5 },
        })
      ).status,
    ).toBe(422);
    expect((await admin.admin.books.post({ ...BOOK_INPUT, keywords: [] })).status).toBe(422);
    expect((await admin.admin.books.post({ ...BOOK_INPUT, keywords: ["삶", "삶"] })).status).toBe(
      422,
    );
    expect(await unwrap(admin.admin.books.get())).toStrictEqual([]);
  });

  it("부록 C에 없는 필드가 오면 거부한다", async () => {
    const { app, cookie } = await signedInServer();

    const response = await app.fetch(
      new Request("http://localhost/api/admin/books", {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ ...BOOK_INPUT, price: 12000 }),
      }),
    );

    expect(response.status).toBe(422);
  });
});

describe("운영자 서가 API", () => {
  it("공개 질문 세트가 없으면 서랍 이름을 만들 수 없어 409다", async () => {
    const { admin } = await signedInServer({ published: false });

    const response = await admin.admin.shelf.get();

    expect(response.status).toBe(409);
    expect(response.error?.value).toStrictEqual({ code: "NO_PUBLISHED_QUESTION_SET" });
  });

  it("서랍 이름·표시·책·수량·게이트를 한 번에 돌려준다", async () => {
    const publishedStore = createMemoryPublishedQuestionSetStore();
    await publishedStore.publish(SEED_QUESTION_SET);
    const server = createTestServer({
      publishedQuestionSetStore: publishedStore,
      bookStore: createMemoryBookStore(SHELF_BOOKS),
      stockStore: createMemoryDrawerStockStore(SHELF_STOCK),
    });
    const cookie = await signInOperator(server.auth);
    const admin = createApiClient(server.app, { headers: { cookie } });

    const shelf = await unwrap(admin.admin.shelf.get());

    expect(shelf.drawers).toStrictEqual(
      SEED_QUESTION_SET.drawers.map(({ code, name, mark }) => ({ code, name, mark })),
    );
    expect(shelf.books).toHaveLength(SHELF_BOOKS.length);
    expect(shelf.stock).toHaveLength(SHELF_STOCK.length);
    expect(shelf.gate).toStrictEqual({
      passed: false,
      lacking: [
        { drawer: "B1", name: "나를 들여다보는 책", kinds: 1 },
        { drawer: "B4", name: "사회를 이해하는 책", kinds: 0 },
        { drawer: "B2", name: "관계를 다시 생각하는 책", kinds: 1 },
        { drawer: "B7", name: "잠시 멈춰 생각하는 책", kinds: 0 },
        { drawer: "B3", name: "다른 삶을 만나는 책", kinds: 0 },
        { drawer: "B5", name: "세계를 넓혀 보는 책", kinds: 0 },
      ],
    });
  });

  it("책을 넣고 수량을 고치면 서가와 키오스크 묶음에 그 수량이 보인다", async () => {
    const { admin } = await signedInServer();
    const book = await unwrap(admin.admin.books.post(BOOK_INPUT));

    expect(
      (await admin.admin.drawers({ drawer: "B6" }).books({ bookId: book.id }).put({ quantity: 3 }))
        .status,
    ).toBe(204);
    let bundle = await unwrap(admin.kiosk.current.get());
    if (bundle.status !== "ready") throw new Error("준비된 묶음이어야 합니다");
    expect(bundle.shelf.drawers.find(({ drawer }) => drawer === "B6")?.books).toStrictEqual([
      {
        bookId: book.id,
        title: book.title,
        author: book.author,
        reason: book.reason,
        question: book.question,
        quantity: 3,
      },
    ]);
    expect(JSON.stringify(bundle.shelf)).not.toContain("relevance");

    expect(
      (await admin.admin.drawers({ drawer: "B6" }).books({ bookId: book.id }).put({ quantity: 0 }))
        .status,
    ).toBe(204);
    bundle = await unwrap(admin.kiosk.current.get());
    if (bundle.status !== "ready") throw new Error("준비된 묶음이어야 합니다");
    expect(bundle.shelf.drawers.find(({ drawer }) => drawer === "B6")?.books[0]?.quantity).toBe(0);

    expect((await admin.admin.shelf.get()).status).toBe(200);
    const shelf = await unwrap(admin.admin.shelf.get());
    expect(shelf.stock).toStrictEqual([{ drawer: "B6", bookId: book.id, quantity: 0 }]);
  });

  it("서랍에서 책을 빼면 수량 0과 달리 줄이 사라진다", async () => {
    const { admin } = await signedInServer();
    const book = await unwrap(admin.admin.books.post(BOOK_INPUT));
    await admin.admin.drawers({ drawer: "B6" }).books({ bookId: book.id }).put({ quantity: 2 });

    expect(
      (await admin.admin.drawers({ drawer: "B6" }).books({ bookId: book.id }).delete()).status,
    ).toBe(204);
    expect((await unwrap(admin.admin.shelf.get())).stock).toStrictEqual([]);
  });

  it("모르는 서랍 코드나 없는 책은 404다", async () => {
    const { admin } = await signedInServer();
    const book = await unwrap(admin.admin.books.post(BOOK_INPUT));

    const drawer = await admin.admin
      .drawers({ drawer: "B9" })
      .books({ bookId: book.id })
      .put({ quantity: 1 });
    expect(drawer.status).toBe(404);
    expect(drawer.error?.value).toStrictEqual({ code: "UNKNOWN_DRAWER" });

    const missing = await admin.admin
      .drawers({ drawer: "B6" })
      .books({ bookId: "book-none" })
      .put({ quantity: 1 });
    expect(missing.status).toBe(404);
    expect(missing.error?.value).toStrictEqual({ code: "BOOK_NOT_FOUND" });
  });
});
