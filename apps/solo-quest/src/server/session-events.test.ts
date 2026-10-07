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
});
