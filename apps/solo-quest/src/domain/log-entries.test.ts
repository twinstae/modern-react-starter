import { describe, expect, it } from "vitest";

import { toLogEntries } from "./log-entries.ts";
import { postedEvent, startedEvent } from "./session.fixture.ts";

describe("이벤트를 로그 항목으로", () => {
  it("대화 이벤트만 편과 화자 이름, 내용, 시각을 가진 항목이 되고 순서가 유지된다", () => {
    const events = [
      startedEvent("s-1"),
      postedEvent("s-1", 2, "문이 열린다"),
      postedEvent("s-1", 3, "안으로 들어간다", "player"),
    ];

    expect(toLogEntries(events)).toStrictEqual([
      {
        kind: "message",
        id: "s-1-event-2",
        side: "master",
        speakerName: "GM",
        content: "문이 열린다",
        createdAt: "2026-10-07T12:00:00Z",
      },
      {
        kind: "message",
        id: "s-1-event-3",
        side: "player",
        speakerName: "Player",
        content: "안으로 들어간다",
        createdAt: "2026-10-07T12:00:00Z",
      },
    ]);
  });
});
