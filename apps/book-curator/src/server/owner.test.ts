import { describe, expect, it } from "vite-plus/test";

import { createApiClient } from "../api-client.ts";
import { createTestServer, signInOperator, TEST_NOW } from "./test-client.ts";

const PIN = "4821";
const WRONG_PIN = "0000";

const plus = (iso: string, ms: number): string => new Date(Date.parse(iso) + ms).toISOString();

/** 운영자 로그인으로 PIN을 정해 두고, 손님처럼 부르는 클라이언트를 함께 돌려준다. */
async function serverWithPin(clock: { now: string }) {
  const server = createTestServer({ now: () => clock.now });
  const cookie = await signInOperator(server.auth);
  const admin = createApiClient(server.app, { headers: { cookie } });
  const response = await admin.admin["owner-pin"].post({ pin: PIN });
  if (response.status !== 204) throw new Error(`PIN 설정 실패: ${response.status}`);
  return { ...server, admin };
}

describe("주인 PIN과 짧은 토큰", () => {
  it("PIN을 정하기 전에는 잠금을 열 수 없다", async () => {
    const { api } = createTestServer();

    const response = await api.owner.unlock.post({ pin: PIN });

    expect(response.status).toBe(409);
    expect(response.error?.value).toStrictEqual({ code: "PIN_NOT_SET" });
  });

  it("운영자 로그인 없이는 PIN을 정할 수 없다", async () => {
    const { api } = createTestServer();

    const response = await api.admin["owner-pin"].post({ pin: PIN });

    expect(response.status).toBe(401);
  });

  it("맞는 PIN이면 10분짜리 주인 토큰을 준다", async () => {
    const clock = { now: TEST_NOW };
    const { api } = await serverWithPin(clock);

    const response = await api.owner.unlock.post({ pin: PIN });

    expect(response.status).toBe(200);
    expect(response.data?.expiresAt).toBe("2026-10-25T00:10:00.000Z");
    expect(response.data?.token.length).toBeGreaterThan(20);
  });

  it("틀린 PIN이 5번 이어지면 잠그고, 60초 뒤에 다시 연다", async () => {
    const clock = { now: TEST_NOW };
    const { api } = await serverWithPin(clock);

    for (let attempt = 0; attempt < 4; attempt += 1) {
      expect((await api.owner.unlock.post({ pin: WRONG_PIN })).status).toBe(401);
    }
    const locked = await api.owner.unlock.post({ pin: WRONG_PIN });
    expect(locked.status).toBe(423);
    expect(locked.error?.value).toStrictEqual({ code: "OWNER_LOCKED" });

    // 잠긴 동안에는 맞는 PIN도 받지 않는다.
    expect((await api.owner.unlock.post({ pin: PIN })).status).toBe(423);

    clock.now = plus(TEST_NOW, 60_000);
    expect((await api.owner.unlock.post({ pin: PIN })).status).toBe(200);
  });

  it("주인 토큰 없이는 주인 확인 API가 401이다", async () => {
    const { api } = createTestServer();

    expect((await api.owner.check.get()).status).toBe(401);
  });

  it("주인 토큰이 있으면 주인 확인 API가 열린다", async () => {
    const clock = { now: TEST_NOW };
    const { app, api } = await serverWithPin(clock);
    const unlocked = await api.owner.unlock.post({ pin: PIN });
    const token = unlocked.data?.token;
    if (token === undefined) throw new Error("토큰을 받지 못했습니다");

    const owner = createApiClient(app, { headers: { authorization: `Bearer ${token}` } });
    const response = await owner.owner.check.get();

    expect(response.status).toBe(200);
    expect(response.data).toStrictEqual({ ok: true });
  });

  it("시간이 지난 주인 토큰은 401이다", async () => {
    const clock = { now: TEST_NOW };
    const { app, api } = await serverWithPin(clock);
    const token = (await api.owner.unlock.post({ pin: PIN })).data?.token;
    if (token === undefined) throw new Error("토큰을 받지 못했습니다");

    clock.now = plus(TEST_NOW, 10 * 60 * 1_000 + 1);

    const owner = createApiClient(app, { headers: { authorization: `Bearer ${token}` } });
    expect((await owner.owner.check.get()).status).toBe(401);
  });
});
