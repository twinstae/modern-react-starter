import { describe, expect, it } from "vitest";

import { postedEvent, startedEvent } from "../domain/session.fixture.ts";
import { unwrap } from "../unwrap.ts";
import { createTestClient, TEST_ID } from "./test-client.ts";

async function setup() {
  const client = createTestClient();
  await unwrap(client.sessions.post({ title: "첫 모험" }));
  return { client, session: client.sessions({ id: TEST_ID }) };
}

describe("세션 이벤트 API", () => {
  it("커밋한 이벤트를 조회하면 같은 이벤트가 버전순으로 돌아온다", async () => {
    const { session } = await setup();
    const events = [startedEvent(TEST_ID), postedEvent(TEST_ID, 2, "문이 열린다\n안은 어둡다")];

    await unwrap(session.events.post({ expectedVersion: 0, events: [events[0]] }));
    await unwrap(session.events.post({ expectedVersion: 1, events: [events[1]] }));

    expect(await unwrap(session.events.get())).toStrictEqual(events);
  });

  it("저장된 마지막 버전과 expectedVersion이 다르면 409이고 로그는 그대로다", async () => {
    const { session } = await setup();
    await unwrap(session.events.post({ expectedVersion: 0, events: [startedEvent(TEST_ID)] }));

    await expect(
      unwrap(
        session.events.post({ expectedVersion: 0, events: [postedEvent(TEST_ID, 1, "중복")] }),
      ),
    ).rejects.toMatchObject({ status: 409 });
    expect(await unwrap(session.events.get())).toStrictEqual([startedEvent(TEST_ID)]);
  });

  it("없는 세션은 조회도 커밋도 404다", async () => {
    const client = createTestClient();
    const session = client.sessions({ id: "없는-세션" });

    await expect(unwrap(session.events.get())).rejects.toMatchObject({ status: 404 });
    await expect(
      unwrap(session.events.post({ expectedVersion: 0, events: [startedEvent("없는-세션")] })),
    ).rejects.toMatchObject({ status: 404 });
  });
});
