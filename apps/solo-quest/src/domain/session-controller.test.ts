import { describe, expect, it } from "vitest";

import { createMemoryEventLogStore, type EventLogStore } from "./event-log-store.ts";
import { postedEvent } from "./session.fixture.ts";
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

  it("제출한 대화는 오류 없이 로그에 편과 화자, 앞뒤 공백을 뺀 내용으로 순서대로 쌓인다", async () => {
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: createMemoryEventLogStore(),
    });
    await controller.load();

    const results = [
      await controller.submit({ side: "master", as: "gm", text: " 문이 열린다\n안은 어둡다 " }),
      await controller.submit({ side: "player", as: "player", text: "안으로 들어간다" }),
    ];

    expect(results).toStrictEqual([undefined, undefined]);
    const { events } = await controller.load();
    expect(events.slice(1).map((event) => event.body)).toStrictEqual([
      { side: "master", as: "gm", content: "문이 열린다\n안은 어둡다" },
      { side: "player", as: "player", content: "안으로 들어간다" },
    ]);
  });

  it("이벤트 로그는 세션을 처음 열 때 한 번만 읽고, 제출해도 다시 읽지 않는다", async () => {
    const memory = createMemoryEventLogStore();
    let reads = 0;
    const counting: EventLogStore = {
      async read(sessionId) {
        reads += 1;
        return memory.read(sessionId);
      },
      append: memory.append,
    };
    const controller = createSessionController({ sessionId: "s-1", eventLog: counting });

    await controller.load();
    await controller.submit({ side: "master", as: "gm", text: "문이 열린다" });
    await controller.submit({ side: "player", as: "player", text: "안으로 들어간다" });
    await controller.load();

    expect(reads).toBe(1);
    // 메모리에 든 목록이 저장된 로그와 같다
    expect((await controller.load()).events).toStrictEqual(await memory.read("s-1"));
  });

  it("구독자는 불러오기와 제출이 끝날 때마다 알림을 받고, 스냅샷에서 로그 항목과 캐릭터를 읽는다", async () => {
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: createMemoryEventLogStore(),
    });
    const notified: number[] = [];
    const unsubscribe = controller.subscribe(() => {
      notified.push(controller.getSnapshot().entries.length);
    });
    expect(controller.getSnapshot().entries).toStrictEqual([]);

    await controller.load();
    await controller.submit({ side: "master", as: "gm", text: "문이 열린다" });
    // 규칙을 어긴 제출은 아무것도 바꾸지 않으므로 알리지 않는다
    await controller.submit({ side: "master", as: "gm", text: " " });
    unsubscribe();
    await controller.submit({ side: "player", as: "player", text: "안으로 들어간다" });

    expect(notified).toStrictEqual([0, 1]);
    const snapshot = controller.getSnapshot();
    expect(snapshot.characters).toStrictEqual(DEFAULT_CHARACTERS);
    expect(
      snapshot.entries.map((entry) => [entry.side, entry.speakerName, entry.content]),
    ).toStrictEqual([
      ["master", "GM", "문이 열린다"],
      ["player", "Player", "안으로 들어간다"],
    ]);
    // 바뀌지 않았다면 같은 스냅샷을 돌려준다(useSyncExternalStore가 요구한다)
    expect(controller.getSnapshot()).toBe(snapshot);
  });

  it("규칙을 어긴 제출은 오류 메시지를 돌려주고 로그에 아무것도 남기지 않는다", async () => {
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: createMemoryEventLogStore(),
    });
    await controller.load();

    expect(await controller.submit({ side: "master", as: "gm", text: "  " })).toBe(
      "내용을 입력해주세요",
    );
    expect(await controller.submit({ side: "master", as: "유령", text: "안녕" })).toBe(
      "말할 수 없는 캐릭터입니다",
    );
    expect((await controller.load()).events).toHaveLength(1);
  });

  it("커밋하는 사이 다른 곳에서 먼저 기록했다면 충돌 안내를 돌려주고 기록은 하나만 남는다", async () => {
    const memory = createMemoryEventLogStore();
    let otherTabIsWriting = false;
    const racing: EventLogStore = {
      read: memory.read,
      // 이 컨트롤러가 커밋하기 직전에 다른 탭이 먼저 기록한 상황
      async append(sessionId, expectedVersion, events) {
        if (otherTabIsWriting) {
          await memory.append(sessionId, expectedVersion, [
            postedEvent(sessionId, expectedVersion + 1, "다른 탭"),
          ]);
        }
        await memory.append(sessionId, expectedVersion, events);
      },
    };
    const controller = createSessionController({ sessionId: "s-1", eventLog: racing });
    await controller.load();
    otherTabIsWriting = true;

    const result = await controller.submit({ side: "master", as: "gm", text: "내 기록" });

    expect(result).toBe("다른 곳에서 먼저 기록했습니다. 최신 기록을 다시 불러왔습니다");
    expect((await controller.load()).events.map((event) => event.body)).toStrictEqual([
      { characters: DEFAULT_CHARACTERS },
      { side: "master", as: "gm", content: "다른 탭" },
    ]);
  });
});
