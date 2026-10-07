import { describe, expect, it } from "vitest";

import { createApp } from "./app.ts";
import { createMemorySessionListStore } from "./session-list-store.ts";

describe("상태 확인 API", () => {
  it("서버가 살아 있으면 ok를 돌려준다", async () => {
    const app = createApp({
      sessionListStore: createMemorySessionListStore(),
      now: () => "2026-10-07T12:00:00Z",
      generateId: () => "session-1",
    });

    const response = await app.handle(new Request("http://localhost/api/health"));

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ status: "ok" });
  });
});
