import { describe, expect, it } from "vite-plus/test";

import { createApiClient } from "../api-client.ts";
import { unwrap } from "../unwrap.ts";
import { createTestServer, signInOperator } from "./test-client.ts";

const book = (title: string) => ({ title, author: "저자", publisher: "출판사" });

async function adminSession() {
  const server = createTestServer();
  const cookie = await signInOperator(server.auth);
  return { ...server, admin: createApiClient(server.app, { headers: { cookie } }) };
}

/** 문항 두 개와 책 세 권을 채운 서랍을 만든다. */
async function fullDrawer(admin: Awaited<ReturnType<typeof adminSession>>["admin"], name: string) {
  const drawer = await unwrap(admin.admin.drawers.post({ name }));
  await unwrap(
    admin.admin.drawers({ id: drawer.id }).patch({ questions: [`${name} 1`, `${name} 2`] }),
  );
  return unwrap(
    admin.admin
      .drawers({ id: drawer.id })
      .books.post({ books: [book(`${name} 책 1`), book(`${name} 책 2`), book(`${name} 책 3`)] }),
  );
}

describe("운영자 서랍 API", () => {
  it("로그인하지 않으면 서랍을 보거나 고칠 수 없다", async () => {
    const { api } = createTestServer();

    expect((await api.admin.drawers.get()).status).toBe(401);
    expect((await api.admin.drawers.post({ name: "서랍" })).status).toBe(401);
    expect((await api.admin.publish.post()).status).toBe(401);
  });

  it("서랍을 만들고 문항을 쓰고 책을 여러 권 올리면 그대로 다시 읽힌다", async () => {
    const { admin } = await adminSession();

    const drawer = await fullDrawer(admin, "나를 들여다보는 책");

    expect(await unwrap(admin.admin.drawers.get())).toStrictEqual([drawer]);
    expect(drawer).toStrictEqual({
      id: drawer.id,
      name: "나를 들여다보는 책",
      questions: ["나를 들여다보는 책 1", "나를 들여다보는 책 2"],
      books: drawer.books.map(({ id }, index) => ({
        id,
        ...book(`나를 들여다보는 책 책 ${index + 1}`),
      })),
    });
  });

  it("책을 고치고 빼고, 서랍을 지우면 그 책도 사라진다", async () => {
    const { admin } = await adminSession();
    const drawer = await fullDrawer(admin, "가 서랍");
    const [first, second] = drawer.books;
    if (first === undefined || second === undefined) throw new Error("책이 있어야 합니다");

    const fixed = await unwrap(
      admin.admin.drawers({ id: drawer.id }).books({ bookId: first.id }).put(book("고친 제목")),
    );
    expect(fixed.books[0]).toStrictEqual({ id: first.id, ...book("고친 제목") });

    const removed = await unwrap(
      admin.admin.drawers({ id: drawer.id }).books({ bookId: second.id }).delete(),
    );
    expect(removed.books.map(({ id }) => id)).not.toContain(second.id);

    expect((await admin.admin.drawers({ id: drawer.id }).delete()).status).toBe(204);
    expect(await unwrap(admin.admin.drawers.get())).toStrictEqual([]);
  });

  it("없는 서랍은 404이고, 빈 이름과 빈 제목은 422다", async () => {
    const { admin } = await adminSession();
    const drawer = await unwrap(admin.admin.drawers.post({ name: "가 서랍" }));

    expect((await admin.admin.drawers({ id: "없음" }).patch({ name: "새 이름" })).status).toBe(404);
    expect((await admin.admin.drawers.post({ name: " " })).status).toBe(422);
    expect(
      (await admin.admin.drawers({ id: drawer.id }).books.post({ books: [book(" ")] })).status,
    ).toBe(422);
  });

  it("서랍이 하나이거나 문항 없는 서랍이 있으면 공개하지 않고 까닭을 알린다", async () => {
    const { admin } = await adminSession();
    const only = await fullDrawer(admin, "가 서랍");

    expect(await unwrap(admin.admin["publish-check"].get())).toStrictEqual({
      canPublish: false,
      failures: [{ code: "too-few-drawers", drawers: [] }],
      warnings: [],
    });

    const empty = await unwrap(admin.admin.drawers.post({ name: "빈 서랍" }));
    const response = await admin.admin.publish.post();

    expect(response.status).toBe(422);
    expect(response.error?.value).toStrictEqual({
      code: "PUBLISH_BLOCKED",
      check: {
        canPublish: false,
        failures: [{ code: "empty-drawer", drawers: [empty.id] }],
        warnings: [{ code: "few-books", drawers: [empty.id] }],
      },
    });
    expect(only.books).toHaveLength(3);
  });

  it("공개하면 손님 태블릿이 그 버전을 받고, 고쳐도 다시 공개하기 전까지 그대로다(I-11)", async () => {
    const { admin, api } = await adminSession();
    const first = await fullDrawer(admin, "가 서랍");
    await fullDrawer(admin, "나 서랍");
    await fullDrawer(admin, "다 서랍");

    expect(await unwrap(admin.admin.publish.post())).toStrictEqual({ version: 1 });
    await unwrap(admin.admin.drawers({ id: first.id }).patch({ name: "고친 서랍" }));

    const bundle = await unwrap(api.kiosk.current.get());
    expect(bundle.status === "ready" ? bundle.questionSet.drawers[0]?.name : null).toBe("가 서랍");
    expect(await unwrap(admin.admin["published-versions"].get())).toStrictEqual([
      { version: 1, drawerCount: 3, questionCount: 6 },
    ]);
  });
});
