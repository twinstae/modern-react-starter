import { describe, expect, it } from "vite-plus/test";

import { sampleFunnelEvents } from "../domain/funnel.fixture.ts";
import { eventStoreContract } from "./event-store.contract.ts";
import { createMemoryEventStore } from "./memory-event-store.ts";

eventStoreContract("메모리", async () => createMemoryEventStore());

describe("메모리 이벤트 저장소", () => {
  it("저장한 뒤 넘긴 배열을 바꿔도 저장된 값은 그대로다", async () => {
    const store = createMemoryEventStore();
    const [ready] = sampleFunnelEvents();
    const batch = [ready!];

    await store.append(batch);
    batch.length = 0;

    expect(await store.list()).toStrictEqual([ready]);
  });
});
