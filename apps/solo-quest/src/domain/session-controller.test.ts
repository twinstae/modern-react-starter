import { describe, expect, it } from "vitest";

import { createMemoryEventLogStore } from "../server/event-log-store.ts";
import { createSessionController } from "./session-controller.ts";
import { DEFAULT_CHARACTERS } from "./session.ts";

describe("세션 컨트롤러", () => {
  it("로그가 빈 세션을 불러오면 시작 이벤트를 커밋하고, 다시 불러와도 다시 시작하지 않는다", async () => {
    const eventLog = createMemoryEventLogStore();
    const controller = createSessionController({ sessionId: "s-1", eventLog });

    const first = await controller.load();
    const second = await controller.load();

    expect(first.characters).toStrictEqual(DEFAULT_CHARACTERS);
    expect(first.events.map((event) => event.eventName)).toStrictEqual(["session:started"]);
    expect(second).toStrictEqual(first);
  });
});
