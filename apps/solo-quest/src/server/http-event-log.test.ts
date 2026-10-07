import { describe, expect, it } from "vitest";

import { createEventLogAdapter } from "../domain/event-log-adapter.ts";
import { createSessionRepository, DEFAULT_CHARACTERS, Session } from "../domain/session.ts";
import { createHttpEventLog } from "./http-event-log.ts";
import { unwrap } from "../unwrap.ts";
import { VersionConflictError } from "../domain/event-log-store.ts";
import { createTestClient, TEST_ID } from "./test-client.ts";

async function setup() {
  const client = createTestClient();
  await unwrap(client.sessions.post({ title: "첫 모험" }));
  const repository = createSessionRepository(createEventLogAdapter(createHttpEventLog(client)));
  const session = Session.create({ entityId: TEST_ID, body: { characters: DEFAULT_CHARACTERS } });
  return { repository, session };
}

describe("HTTP 이벤트 로그 어댑터", () => {
  it("repository로 커밋하고 다시 불러오면 상태와 버전이 같다", async () => {
    const { repository, session } = await setup();
    session.postMessage("master", "gm", "문이 열린다");

    await repository.commit(session);
    const reloaded = await repository.findOne({ entityId: TEST_ID });

    expect(reloaded?.version).toBe(2);
    expect(reloaded?.state).toStrictEqual(session.state);
  });

  it("다른 곳에서 먼저 커밋했다면 409가 충돌 예외가 된다", async () => {
    const { repository, session } = await setup();
    await repository.commit(session);
    const first = await repository.findOne({ entityId: TEST_ID });
    const second = await repository.findOne({ entityId: TEST_ID });
    first?.postMessage("master", "gm", "먼저");
    second?.postMessage("master", "gm", "나중");

    await repository.commit(first!);
    await expect(repository.commit(second!)).rejects.toThrow(VersionConflictError);
  });
});
