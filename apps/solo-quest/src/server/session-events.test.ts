import { describe, expect, it } from "vitest";

import { postedEvent, rolledEvent, startedEvent } from "../domain/session.fixture.ts";
import type { SessionEvent } from "../domain/session.ts";
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

  it("판정 이벤트도 커밋하고 조회하면 굴린 결과가 그대로 돌아온다", async () => {
    const { session } = await setup();
    const events = [startedEvent(TEST_ID), rolledEvent(TEST_ID, 2, "자물쇠 따기")];

    await unwrap(session.events.post({ expectedVersion: 0, events }));

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

  it.each([
    ["141자 내용의 이벤트", 0, [postedEvent(TEST_ID, 1, "가".repeat(141))]],
    ["141자 라벨의 판정 이벤트", 0, [rolledEvent(TEST_ID, 1, "가".repeat(141))]],
    ["스키마에 없는 이벤트", 0, [{ ...startedEvent(TEST_ID), eventName: "session:unknown" }]],
    ["버전을 건너뛴 이벤트", 0, [startedEvent(TEST_ID), postedEvent(TEST_ID, 3, "건너뜀")]],
    ["버전이 겹친 이벤트", 0, [startedEvent(TEST_ID), postedEvent(TEST_ID, 1, "겹침")]],
    ["expectedVersion 다음 버전이 아닌 이벤트", 0, [postedEvent(TEST_ID, 2, "늦음")]],
    ["다른 세션의 이벤트", 0, [startedEvent("다른-세션")]],
  ])("%s는 422이고 로그에 들어가지 않는다", async (_name, expectedVersion, events) => {
    const { session } = await setup();

    await expect(
      // 잘못된 이벤트를 일부러 보내므로 타입을 우회한다
      unwrap(session.events.post({ expectedVersion, events: events as SessionEvent[] })),
    ).rejects.toMatchObject({ status: 422 });
    expect(await unwrap(session.events.get())).toStrictEqual([]);
  });
});
