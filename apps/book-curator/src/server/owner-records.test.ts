import { describe, expect, it } from "vite-plus/test";

import { createApiClient } from "../api-client.ts";
import type { HandoverInput } from "../domain/owner-record.ts";
import { createMemoryDrawerStockStore } from "../persistence/memory-shelf-store.ts";
import { createTestServer, signInOperator, TEST_NOW } from "./test-client.ts";

const PIN = "4821";

const plus = (iso: string, ms: number): string => new Date(Date.parse(iso) + ms).toISOString();

const HANDOVER: HandoverInput = {
  sessionId: "session-owner-1",
  version: 2,
  recommended: "B6",
  handed: "B1",
};

/** PIN을 정하고, 주인 토큰을 받은 클라이언트까지 준비한다. 시각은 테스트가 움직인다. */
async function ownerSession(clock: { now: string }) {
  const stockStore = createMemoryDrawerStockStore();
  const server = createTestServer({ now: () => clock.now, stockStore });
  const cookie = await signInOperator(server.auth);
  const admin = createApiClient(server.app, { headers: { cookie } });
  const pinned = await admin.admin["owner-pin"].post({ pin: PIN });
  if (pinned.status !== 204) throw new Error(`PIN 설정 실패: ${pinned.status}`);

  const unlocked = await server.api.owner.unlock.post({ pin: PIN });
  const token = unlocked.data?.token;
  if (token === undefined) throw new Error("주인 토큰을 받지 못했습니다");

  const owner = createApiClient(server.app, { headers: { authorization: `Bearer ${token}` } });
  return { ...server, admin, owner, token, stockStore };
}

describe("주인 확인 API", () => {
  it("토큰이 없으면 열쇠 건넴과 산 책 기록이 401이다", async () => {
    const { api } = createTestServer();

    expect((await api.owner.handover.post(HANDOVER)).status).toBe(401);
    expect(
      (
        await api.owner.purchases.post({
          sessionId: "session-owner-1",
          version: 2,
          drawer: "B6",
          bookId: "book-b6-1",
        })
      ).status,
    ).toBe(401);
  });

  it("시간이 지난 주인 토큰은 열쇠 건넴과 산 책 기록에서 401이다", async () => {
    const clock = { now: TEST_NOW };
    const { owner } = await ownerSession(clock);

    clock.now = plus(TEST_NOW, 10 * 60 * 1_000 + 1);

    expect((await owner.owner.handover.post(HANDOVER)).status).toBe(401);
    expect(
      (
        await owner.owner.purchases.post({
          sessionId: "session-owner-1",
          version: 2,
          drawer: "B6",
          bookId: "book-b6-1",
        })
      ).status,
    ).toBe(401);
  });

  it("열쇠 건넴에 추천·건넨 서랍과 버전을 함께 남긴다(R-7, I-16)", async () => {
    const clock = { now: TEST_NOW };
    const { owner, handoverStore } = await ownerSession(clock);

    const response = await owner.owner.handover.post(HANDOVER);

    expect(response.status).toBe(201);
    expect(response.data).toMatchObject(HANDOVER);
    expect(response.data?.recommended).not.toBe(response.data?.handed);
    expect(await handoverStore.list("session-owner-1")).toStrictEqual([response.data]);
  });

  it("산 책을 기록하면 그 서랍의 수량이 1 줄고, 0에서 더 내려가지 않는다(R-9)", async () => {
    const clock = { now: TEST_NOW };
    const { owner, stockStore, purchaseStore } = await ownerSession(clock);
    await stockStore.setQuantity("B6", "book-b6-1", 2);

    const purchase = {
      sessionId: "session-owner-1",
      version: 2,
      drawer: "B6" as const,
      bookId: "book-b6-1",
    };

    const first = await owner.owner.purchases.post(purchase);
    expect(first.status).toBe(200);
    expect(first.data).toStrictEqual({ quantity: 1 });

    expect((await owner.owner.purchases.post(purchase)).data).toStrictEqual({ quantity: 0 });
    expect((await owner.owner.purchases.post(purchase)).data).toStrictEqual({ quantity: 0 });

    expect(await stockStore.list()).toStrictEqual([
      { drawer: "B6", bookId: "book-b6-1", quantity: 0 },
    ]);
    expect(await purchaseStore.list("session-owner-1")).toHaveLength(3);
  });

  it("서랍에 그 책 줄이 없어도 기록은 남기고 수량 0으로 답한다", async () => {
    const clock = { now: TEST_NOW };
    const { owner, stockStore, purchaseStore } = await ownerSession(clock);

    const response = await owner.owner.purchases.post({
      sessionId: "session-owner-1",
      version: 2,
      drawer: "B1",
      bookId: "book-missing",
    });

    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({ quantity: 0 });
    expect(await stockStore.list()).toStrictEqual([]);
    expect(await purchaseStore.list("session-owner-1")).toHaveLength(1);
  });

  it("버전·서랍 코드·세션 ID가 어긋나면 422이고 저장하지 않는다", async () => {
    const clock = { now: TEST_NOW };
    const { owner, handoverStore, purchaseStore } = await ownerSession(clock);

    expect(
      (
        await owner.owner.handover.post({
          ...HANDOVER,
          version: 0,
        } as never)
      ).status,
    ).toBe(422);
    expect(
      (
        await owner.owner.handover.post({
          ...HANDOVER,
          handed: "B9",
        } as never)
      ).status,
    ).toBe(422);
    expect(
      (
        await owner.owner.handover.post({
          ...HANDOVER,
          sessionId: " ",
        } as never)
      ).status,
    ).toBe(422);
    expect(
      (
        await owner.owner.purchases.post({
          sessionId: "session-owner-1",
          version: 2,
          drawer: "B6",
          bookId: "book-b6-1",
          nickname: "토끼",
        } as never)
      ).status,
    ).toBe(422);

    expect(await handoverStore.list()).toStrictEqual([]);
    expect(await purchaseStore.list()).toStrictEqual([]);
  });

  it("주인 API에는 별명 자리가 없고, 운영자·키오스크 경계는 그대로다(I-12)", async () => {
    const clock = { now: TEST_NOW };
    const { owner, admin, api } = await ownerSession(clock);

    expect((await api.kiosk.current.get()).status).toBe(200);
    expect((await admin.admin.books.get()).status).toBe(200);
    expect((await api.admin.books.get()).status).toBe(401);

    // 주인 토큰으로는 운영자 API를, 운영자 쿠키로는 주인 API를 열 수 없다.
    expect((await owner.admin.books.get()).status).toBe(401);
    expect((await admin.owner.handover.post(HANDOVER)).status).toBe(401);

    const record = await owner.owner.handover.post(HANDOVER);
    expect(JSON.stringify(record.data)).not.toMatch(/nickname|토끼|name/i);
  });
});
