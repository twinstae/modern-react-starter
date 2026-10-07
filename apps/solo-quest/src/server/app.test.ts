import { describe, expect, it } from "vitest";

import { createApp } from "./app.ts";

describe("상태 확인 API", () => {
  it("서버가 살아 있으면 ok를 돌려준다", async () => {
    const app = createApp();

    const response = await app.handle(new Request("http://localhost/api/health"));

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ status: "ok" });
  });
});
