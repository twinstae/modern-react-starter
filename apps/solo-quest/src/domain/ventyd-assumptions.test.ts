import { describe, expect, it } from "vitest";

import { createSessionRepository, DEFAULT_CHARACTERS, Session } from "./session.ts";

/**
 * 저장 줄(`createSaveQueue`)은 ventyd가 이 가정을 지킨다고 믿고 만들었다.
 * ventyd를 올린 뒤 이 테스트가 실패하면 저장 줄의 `run`이 묶음에 제출을 잇지 못한다.
 */
describe("ventyd 가정", () => {
  it("repository.commit은 첫 await 전에 어댑터의 commitEvents를 동기로 부르고, 이때 큐를 이미 비웠다", async () => {
    const calls: Array<{ events: number; expectedVersion: number | undefined }> = [];
    const repository = createSessionRepository({
      getEventsByEntityId: async () => [],
      commitEvents: async ({ events, expectedVersion }) => {
        calls.push({ events: events.length, expectedVersion });
      },
    });
    const session = Session.create({ entityId: "s-1", body: { characters: DEFAULT_CHARACTERS } });
    session.postMessage("master", "gm", "문이 열린다");

    const committing = repository.commit(session);

    // await 하기 전에 이미 불렸다
    expect(calls).toStrictEqual([{ events: 2, expectedVersion: 0 }]);
    await committing;
    // 큐가 비었으므로 다음 commit은 새로 쌓인 이벤트만 보낸다
    session.postMessage("master", "gm", "안은 어둡다");
    await repository.commit(session);
    expect(calls.at(-1)).toStrictEqual({ events: 1, expectedVersion: 2 });
  });
});
