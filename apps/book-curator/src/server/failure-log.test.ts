import { describe, expect, it } from "vite-plus/test";

import { createMemoryPublishedQuestionSetStore } from "../persistence/memory-published-question-set-store.ts";
import type { FailureLog } from "./failure-log.ts";
import { createLazyApp } from "./lazy-app.ts";
import { createTestClient } from "./test-client.ts";

describe("실패 로그", () => {
  it("요청을 처리하다 저장소가 실패하면 어느 요청에서 무엇이 실패했는지 남긴다", async () => {
    const logs: FailureLog[] = [];
    const broken = new Error("연결이 끊겼습니다");
    const client = createTestClient({
      publishedQuestionSetStore: {
        ...createMemoryPublishedQuestionSetStore(),
        current: () => Promise.reject(broken),
      },
      logFailure: (entry) => logs.push(entry),
    });

    const { error } = await client.kiosk.current.get();

    expect(error?.status).toBe(500);
    expect(logs).toStrictEqual([
      { stage: "요청 처리", detail: "GET /api/kiosk/current", error: broken },
    ]);
  });

  it("요청 본문이 틀린 것은 서버 실패가 아니라 남기지 않는다", async () => {
    const logs: FailureLog[] = [];
    const client = createTestClient({ logFailure: (entry) => logs.push(entry) });

    // @ts-expect-error 일부러 틀린 본문을 보낸다
    const { error } = await client.events.post({ events: "틀림" });

    expect(error?.status).toBe(422);
    expect(logs).toStrictEqual([]);
  });

  it("앱을 여는 단계가 실패하면 그 단계를 남기고, 다음 요청에서 다시 연다", async () => {
    const logs: FailureLog[] = [];
    const broken = new Error("POSTGRES_URL로 연결하지 못했습니다");
    let attempts = 0;
    const getApp = createLazyApp({
      logFailure: (entry) => logs.push(entry),
      steps: async (step) => {
        attempts += 1;
        await step("DB 연결", async () => {
          if (attempts === 1) throw broken;
        });
        return step("앱 조립", async () => "앱");
      },
    });

    await expect(getApp()).rejects.toBe(broken);
    expect(await getApp()).toBe("앱");
    expect(logs).toStrictEqual([
      { stage: "DB 연결", detail: "앱을 열지 못했습니다", error: broken },
    ]);
  });
});
