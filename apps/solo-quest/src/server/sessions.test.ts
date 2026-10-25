import { describe, expect, it } from "vite-plus/test";

import { unwrap } from "../unwrap.ts";
import { createTestClient, TEST_ID, TEST_NOW } from "./test-client.ts";

describe("세션 API", () => {
  it("제목으로 세션을 만들면 목록과 단건 조회에 나온다", async () => {
    const client = createTestClient();
    const expected = { id: TEST_ID, title: "첫 모험", createdAt: TEST_NOW };

    expect(await unwrap(client.sessions.post({ title: "  첫 모험 " }))).toStrictEqual(expected);
    expect(await unwrap(client.sessions.get())).toStrictEqual([expected]);
    expect(await unwrap(client.sessions({ id: TEST_ID }).get())).toStrictEqual(expected);
  });

  it.each([
    ["빈 제목", ""],
    ["공백만 있는 제목", "   "],
    ["141자 제목", "가".repeat(141)],
  ])("%s으로는 세션을 만들 수 없다", async (_name, title) => {
    const client = createTestClient();

    await expect(unwrap(client.sessions.post({ title }))).rejects.toMatchObject({ status: 422 });
    expect(await unwrap(client.sessions.get())).toStrictEqual([]);
  });

  it("없는 세션은 404다", async () => {
    const client = createTestClient();

    await expect(unwrap(client.sessions({ id: "없는-세션" }).get())).rejects.toMatchObject({
      status: 404,
    });
  });
});
