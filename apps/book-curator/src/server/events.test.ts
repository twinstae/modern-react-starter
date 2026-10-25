import { describe, expect, it } from "vite-plus/test";

import { sampleFunnelEvents } from "../domain/funnel.fixture.ts";
import { createMemoryEventStore } from "../persistence/memory-event-store.ts";
import { createMemoryPublishedQuestionSetStore } from "../persistence/memory-published-question-set-store.ts";
import { unwrap } from "../unwrap.ts";
import { createApp } from "./app.ts";
import { createTestClient, TEST_NOW } from "./test-client.ts";

/** 일부러 스키마를 어긴 요청을 보내기 위한 좁은 통로. 실제 호출은 타입이 맞는다. */
function postRaw(client: ReturnType<typeof createTestClient>, body: unknown) {
  return client.events.post(body as never);
}

describe("퍼널 이벤트 API", () => {
  it("스키마를 통과한 묶음을 저장하고 204로 답한다", async () => {
    const eventStore = createMemoryEventStore();
    const client = createTestClient({ eventStore });
    const events = sampleFunnelEvents();

    const response = await client.events.post({ events });

    expect(response.error).toBeNull();
    expect(response.data).toBe("");
    expect(await eventStore.list()).toStrictEqual(events);
  });

  it("이름·별명·전화번호 같은 필드를 더하면 422로 거부하고 아무것도 저장하지 않는다(I-12)", async () => {
    const eventStore = createMemoryEventStore();
    const client = createTestClient({ eventStore });
    const [ready] = sampleFunnelEvents();

    for (const extra of [
      { nickname: "토끼" },
      { name: "서윤" },
      { phone: "010-0000-0000" },
      { userAgent: "Mozilla/5.0" },
    ]) {
      const response = await postRaw(client, { events: [{ ...ready, ...extra }] });

      expect(response.error?.status).toBe(422);
      expect(await eventStore.list()).toStrictEqual([]);
    }
  });

  it("허용 목록에 없는 이벤트 종류도 422로 거부한다", async () => {
    const eventStore = createMemoryEventStore();
    const client = createTestClient({ eventStore });
    const [ready] = sampleFunnelEvents();

    const response = await postRaw(client, {
      events: [{ ...ready, type: "nickname_saved" }],
    });

    expect(response.error?.status).toBe(422);
    expect(await eventStore.list()).toStrictEqual([]);
  });

  it("버전이 빠진 이벤트는 422로 거부한다(I-16)", async () => {
    const eventStore = createMemoryEventStore();
    const client = createTestClient({ eventStore });
    const [ready] = sampleFunnelEvents();
    if (ready === undefined) throw new Error("픽스처가 필요합니다");
    const withoutVersion = {
      sessionId: ready.sessionId,
      kioskName: ready.kioskName,
      type: ready.type,
    };

    const response = await postRaw(client, { events: [withoutVersion] });

    expect(response.error?.status).toBe(422);
    expect(await eventStore.list()).toStrictEqual([]);
  });

  it("요청 헤더의 IP·User-Agent는 저장된 이벤트에 들어가지 않는다", async () => {
    const eventStore = createMemoryEventStore();
    const app = createApp({
      now: () => TEST_NOW,
      publishedQuestionSetStore: createMemoryPublishedQuestionSetStore(),
      eventStore,
    });
    const events = sampleFunnelEvents();

    const response = await app.fetch(
      new Request("http://localhost/api/events", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-forwarded-for": "203.0.113.7",
          "user-agent": "KioskTablet/1.0",
        },
        body: JSON.stringify({ events }),
      }),
    );

    expect(response.status).toBe(204);
    expect(await eventStore.list()).toStrictEqual(events);
    expect(Object.keys((await eventStore.list())[0] ?? {}).sort()).toStrictEqual([
      "kioskName",
      "sessionId",
      "type",
      "version",
    ]);
  });

  it("빈 묶음과 묶음 밖의 필드는 422로 거부한다", async () => {
    const eventStore = createMemoryEventStore();
    const client = createTestClient({ eventStore });

    expect((await postRaw(client, { events: [] })).error?.status).toBe(422);
    expect(
      (await postRaw(client, { events: sampleFunnelEvents(), nickname: "토끼" })).error?.status,
    ).toBe(422);
    expect(await eventStore.list()).toStrictEqual([]);
  });

  it("여러 번 보낸 이벤트도 순서대로 쌓인다", async () => {
    const eventStore = createMemoryEventStore();
    const client = createTestClient({ eventStore });
    const events = sampleFunnelEvents();

    await unwrap(client.events.post({ events: events.slice(0, 2) }));
    await unwrap(client.events.post({ events: events.slice(2) }));

    expect(await eventStore.list()).toStrictEqual(events);
  });
});
