import { describe, expect, it } from "vite-plus/test";

import { snapshotOf } from "../domain/kiosk.ts";
import { SEED_DRAWERS } from "../domain/seed-question-set.ts";
import { createMemoryPublishedVersionStore } from "../persistence/memory-published-version-store.ts";
import { unwrap } from "../unwrap.ts";
import { createTestClient } from "./test-client.ts";

describe("키오스크 공개 묶음 API", () => {
  it("공개 버전이 없으면 준비 중이라고 답한다", async () => {
    const client = createTestClient();

    expect(await unwrap(client.kiosk.current.get())).toStrictEqual({ status: "preparing" });
  });

  it("가장 최근 공개 버전의 질문 세트와 서랍 속 책을 묶어 준다", async () => {
    const store = createMemoryPublishedVersionStore();
    await store.publish(snapshotOf(SEED_DRAWERS.slice(0, 2)));
    await store.publish(snapshotOf(SEED_DRAWERS));
    const client = createTestClient({ publishedVersionStore: store });

    expect(await unwrap(client.kiosk.current.get())).toStrictEqual({
      status: "ready",
      version: 2,
      ...snapshotOf(SEED_DRAWERS),
    });
  });
});
