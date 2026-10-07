import { describe, expect, it } from "vitest";

import { toLogEntries } from "./log-entries.ts";
import {
  characterAddedEvent,
  characterArchivedEvent,
  postedEvent,
  rolledEvent,
  startedEvent,
} from "./session.fixture.ts";

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
        speakerId: "gm",
        speakerName: "GM",
        content: "문이 열린다",
        createdAt: "2026-10-07T12:00:00Z",
      },
      {
        kind: "message",
        id: "s-1-event-3",
        side: "player",
        speakerId: "player",
        speakerName: "Player",
        content: "안으로 들어간다",
        createdAt: "2026-10-07T12:00:00Z",
      },
    ]);
  });

  it("판정 이벤트는 표기와 굴린 항, 합계, 라벨을 가진 항목이 되고 대화와 순서가 섞여 유지된다", () => {
    const events = [
      startedEvent("s-1"),
      postedEvent("s-1", 2, "문이 열린다"),
      rolledEvent("s-1", 3, "자물쇠 따기"),
      rolledEvent("s-1", 4),
    ];

    const entries = toLogEntries(events);

    expect(entries.map((entry) => entry.kind)).toStrictEqual(["message", "roll", "roll"]);
    expect(entries[1]).toStrictEqual({
      kind: "roll",
      id: "s-1-event-3",
      side: "master",
      speakerId: "gm",
      speakerName: "GM",
      notation: "2d6+1",
      terms: [
        { type: "dice", sign: 1, sides: 6, values: [4, 6] },
        { type: "constant", sign: 1, value: 1 },
      ],
      total: 11,
      label: "자물쇠 따기",
      createdAt: "2026-10-07T12:00:00Z",
    });
    // 라벨이 없으면 label 키 자체가 없다
    expect(entries[2]).not.toHaveProperty("label");
  });

  it("나중에 추가한 캐릭터의 기록에도, 그 뒤 보관한 캐릭터의 지난 기록에도 이름이 보인다", () => {
    const events = [
      startedEvent("s-1"),
      characterAddedEvent("s-1", 2, "guard", "경비병"),
      postedEvent("s-1", 3, "멈춰라", "master", "guard"),
      characterArchivedEvent("s-1", 4, "guard"),
    ];

    expect(
      toLogEntries(events).map(({ speakerId, speakerName }) => [speakerId, speakerName]),
    ).toStrictEqual([["guard", "경비병"]]);
  });
});
