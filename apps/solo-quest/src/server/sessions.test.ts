import { describe, expect, it } from "vitest";

import { createApp } from "./app.ts";
import { createMemorySessionListStore } from "./session-list-store.ts";

function setup() {
  return createApp({
    sessionListStore: createMemorySessionListStore(),
    now: () => "2026-10-07T12:00:00Z",
    generateId: () => "session-1",
  });
}

const json = (body: unknown) => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

describe("세션 API", () => {
  it("제목으로 세션을 만들면 목록과 단건 조회에 나온다", async () => {
    const app = setup();
    const expected = { id: "session-1", title: "첫 모험", createdAt: "2026-10-07T12:00:00Z" };

    const created = await app.handle(
      new Request("http://localhost/api/sessions", json({ title: "  첫 모험 " })),
    );
    expect(created.status).toBe(200);
    expect(await created.json()).toStrictEqual(expected);

    const list = await app.handle(new Request("http://localhost/api/sessions"));
    expect(await list.json()).toStrictEqual([expected]);

    const one = await app.handle(new Request("http://localhost/api/sessions/session-1"));
    expect(await one.json()).toStrictEqual(expected);
  });

  it.each([
    ["빈 제목", ""],
    ["공백만 있는 제목", "   "],
    ["141자 제목", "가".repeat(141)],
  ])("%s으로는 세션을 만들 수 없다", async (_name, title) => {
    const app = setup();

    const response = await app.handle(
      new Request("http://localhost/api/sessions", json({ title })),
    );

    expect(response.status).toBe(422);
    const list = await app.handle(new Request("http://localhost/api/sessions"));
    expect(await list.json()).toStrictEqual([]);
  });

  it("없는 세션은 404다", async () => {
    const app = setup();

    const response = await app.handle(new Request("http://localhost/api/sessions/없는-세션"));

    expect(response.status).toBe(404);
  });
});
