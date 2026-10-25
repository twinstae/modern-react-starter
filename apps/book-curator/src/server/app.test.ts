import { describe, expect, it } from "vite-plus/test";

import { unwrap } from "../unwrap.ts";
import { createTestClient, TEST_NOW } from "./test-client.ts";

describe("상태 확인 API", () => {
  it("서버가 살아 있으면 확인 시각과 함께 ok를 돌려준다", async () => {
    const client = createTestClient();

    expect(await unwrap(client.health.get())).toStrictEqual({
      status: "ok",
      checkedAt: TEST_NOW,
    });
  });
});
