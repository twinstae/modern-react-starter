import { describe, expect, it } from "vite-plus/test";

import { sampleFunnelEvents } from "../domain/funnel.fixture.ts";
import type { FunnelEvent } from "../domain/funnel.ts";
import { createEventQueue } from "./event-queue.ts";

describe("이벤트 큐", () => {
  it("전송이 실패하면 대기열을 그대로 두고, 다음 flush가 처음부터 순서대로 다시 보낸다", async () => {
    const sent: FunnelEvent[][] = [];
    let offline = true;
    const queue = createEventQueue(async (events) => {
      if (offline) throw new Error("오프라인");
      sent.push([...events]);
    });
    const events = sampleFunnelEvents();

    queue.enqueue(events.slice(0, 2));
    queue.enqueue(events.slice(2));

    expect(await queue.flush()).toBe(false);
    expect(sent).toStrictEqual([]);

    offline = false;
    expect(await queue.flush()).toBe(true);
    expect(sent).toStrictEqual([events]);

    expect(await queue.flush()).toBe(true);
    expect(sent).toStrictEqual([events]);
  });

  it("보낼 것이 없으면 전송 함수를 부르지 않고 성공한다", async () => {
    const sent: FunnelEvent[][] = [];
    const queue = createEventQueue(async (events) => {
      sent.push([...events]);
    });

    expect(await queue.flush()).toBe(true);
    expect(sent).toStrictEqual([]);
  });

  it("보내는 동안 새로 쌓인 이벤트는 다음 flush로 넘긴다", async () => {
    const events = sampleFunnelEvents();
    const sent: FunnelEvent[][] = [];
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queue = createEventQueue(async (batch) => {
      await gate;
      sent.push([...batch]);
    });

    queue.enqueue(events.slice(0, 1));
    const first = queue.flush();
    queue.enqueue(events.slice(1));
    release?.();

    expect(await first).toBe(true);
    expect(sent).toStrictEqual([events.slice(0, 1)]);

    expect(await queue.flush()).toBe(true);
    expect(sent).toStrictEqual([events.slice(0, 1), events.slice(1)]);
  });
});
