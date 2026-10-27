import { describe, expect, it } from "vite-plus/test";

import { createApiClient } from "../api-client.ts";
import type { HandoverInput } from "../domain/owner-record.ts";
import { createTestServer, signInOperator, TEST_NOW } from "./test-client.ts";

const PIN = "4821";

const plus = (iso: string, ms: number): string => new Date(Date.parse(iso) + ms).toISOString();

const HANDOVER: HandoverInput = {
  sessionId: "session-owner-1",
  version: 2,
  recommended: "B6",
  handed: "B1",
};

/** PIN을 생성하고, 주인 토큰을 받은 클라이언트까지 준비한다. 시각은 테스트가 움직인다. */
async function ownerSession(clock: { now: string }) {
  const server = createTestServer({ now: () => clock.now, newOwnerPin: () => PIN });
  const cookie = await signInOperator(server.auth);
  const admin = createApiClient(server.app, { headers: { cookie } });
  await admin.admin["owner-pin"].post();

  const unlocked = await server.api.owner.unlock.post({ pin: PIN });
  const token = unlocked.data?.token;
  if (token === undefined) throw new Error("주인 토큰을 받지 못했습니다");

  const owner = createApiClient(server.app, { headers: { authorization: `Bearer ${token}` } });
  return { ...server, admin, owner };
}

describe("주인 확인 API", () => {
  it("토큰이 없거나 시간이 지났으면 열쇠 건넴이 401이다", async () => {
    const clock = { now: TEST_NOW };
    const { api, owner } = await ownerSession(clock);

    expect((await api.owner.handover.post(HANDOVER)).status).toBe(401);
    clock.now = plus(TEST_NOW, 10 * 60 * 1_000 + 1);
    expect((await owner.owner.handover.post(HANDOVER)).status).toBe(401);
  });

  it("열쇠 건넴에 추천·건넨 서랍과 버전을 함께 남긴다(R-7, I-16)", async () => {
    const { owner, handoverStore } = await ownerSession({ now: TEST_NOW });

    const response = await owner.owner.handover.post(HANDOVER);

    expect(response.status).toBe(201);
    expect(response.data).toMatchObject(HANDOVER);
    expect(await handoverStore.list("session-owner-1")).toStrictEqual([response.data]);
  });

  it("버전·세션 ID가 어긋나거나 별명을 보내면 422이고 저장하지 않는다(I-12)", async () => {
    const { owner, handoverStore } = await ownerSession({ now: TEST_NOW });

    for (const body of [
      { ...HANDOVER, version: 0 },
      { ...HANDOVER, sessionId: " " },
      { ...HANDOVER, nickname: "토끼" },
    ]) {
      expect((await owner.owner.handover.post(body as never)).status).toBe(422);
    }
    expect(await handoverStore.list()).toStrictEqual([]);
  });

  it("주인 토큰으로는 운영자 API를, 운영자 쿠키로는 주인 API를 열 수 없다", async () => {
    const { owner, admin, api } = await ownerSession({ now: TEST_NOW });

    expect((await admin.admin.drawers.get()).status).toBe(200);
    expect((await api.admin.drawers.get()).status).toBe(401);
    expect((await owner.admin.drawers.get()).status).toBe(401);
    expect((await admin.owner.handover.post(HANDOVER)).status).toBe(401);
  });
});
