import { describe, expect, it } from "vitest";

import { createMemoryEventLogStore, type EventLogStore } from "./event-log-store.ts";
import { createFakeEventLog } from "./event-log-store.fake.ts";
import { postedEvent } from "./session.fixture.ts";
import { createSessionController } from "./session-controller.ts";
import { DEFAULT_CHARACTERS } from "./session.ts";

/** 항상 0.5를 내는 난수. d6은 4가 나온다. */
const fixedRandom = () => 0.5;

/** character-1, character-2, ... 차례로 내는 id 생성기 */
const sequentialIds = () => {
  let count = 0;
  return () => `character-${++count}`;
};

describe("세션 컨트롤러", () => {
  it("로그가 빈 세션을 불러오면 시작 이벤트를 커밋하고, 다시 불러와도 다시 시작하지 않는다", async () => {
    const eventLog = createMemoryEventLogStore();
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog,
      random: fixedRandom,
      generateId: sequentialIds(),
    });

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
      random: fixedRandom,
      generateId: sequentialIds(),
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
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: counting,
      random: fixedRandom,
      generateId: sequentialIds(),
    });

    await controller.load();
    await controller.submit({ side: "master", as: "gm", text: "문이 열린다" });
    await controller.submit({ side: "player", as: "player", text: "안으로 들어간다" });
    await controller.load();

    expect(reads).toBe(1);
    // 메모리에 든 목록이 저장된 로그와 같다
    expect((await controller.load()).events).toStrictEqual(await memory.read("s-1"));
  });

  it("구독자는 불러오기와 제출, 저장이 끝날 때마다 알림을 받고, 스냅샷에서 로그 항목과 캐릭터를 읽는다", async () => {
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: createMemoryEventLogStore(),
      random: fixedRandom,
      generateId: sequentialIds(),
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

    // 불러오기, 제출(저장 중), 저장 끝
    expect(notified).toStrictEqual([0, 1, 1]);
    const snapshot = controller.getSnapshot();
    expect(snapshot.characters).toStrictEqual(DEFAULT_CHARACTERS);
    expect(
      snapshot.entries.map((entry) => [
        entry.side,
        entry.speakerName,
        entry.kind === "message" ? entry.content : undefined,
      ]),
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
      random: fixedRandom,
      generateId: sequentialIds(),
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

  it("커밋하는 사이 다른 곳에서 먼저 기록했다면 다시 불러와 다른 곳의 기록만 남는다", async () => {
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
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: racing,
      random: fixedRandom,
      generateId: sequentialIds(),
    });
    await controller.load();
    otherTabIsWriting = true;

    await controller.submit({ side: "master", as: "gm", text: "내 기록" });
    await controller.idle();

    expect((await controller.load()).events.map((event) => event.body)).toStrictEqual([
      { characters: DEFAULT_CHARACTERS },
      { side: "master", as: "gm", content: "다른 탭" },
    ]);
  });

  it("/r 입력은 주입한 난수로 굴려 굴린 결과를 라벨과 함께 판정으로 남긴다", async () => {
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: createMemoryEventLogStore(),
      random: fixedRandom,
      generateId: sequentialIds(),
    });
    await controller.load();

    const result = await controller.submit({
      side: "player",
      as: "player",
      text: "/r 2d6+1 자물쇠 따기",
    });

    expect(result).toBeUndefined();
    const { events, entries } = controller.getSnapshot();
    expect(events.at(-1)?.eventName).toBe("session:dice_rolled");
    expect(events.at(-1)?.body).toStrictEqual({
      side: "player",
      as: "player",
      notation: "2d6+1",
      terms: [
        { type: "dice", sign: 1, sides: 6, values: [4, 4] },
        { type: "constant", sign: 1, value: 1 },
      ],
      total: 9,
      label: "자물쇠 따기",
    });
    expect(entries.map((entry) => entry.kind)).toStrictEqual(["roll"]);
  });

  it.each([
    ["잘못된 표기", "/r 2x6 자물쇠", "주사위 표기가 올바르지 않습니다: 2x6"],
    ["상한을 넘는 표기", "/r 101d6", "주사위는 모두 100개까지 굴릴 수 있습니다"],
    ["표기가 없는 /r", "/r", "굴릴 주사위 표기를 적어주세요. 예: /r 2d6+1"],
    ["알 수 없는 명령", "/desc 안개", "알 수 없는 명령입니다: /desc"],
    ["141자 라벨", `/r d20 ${"가".repeat(141)}`, "140자 이하로 입력해주세요"],
  ])("%s는 오류 메시지를 돌려주고 이벤트를 만들지 않는다", async (_name, text, message) => {
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: createMemoryEventLogStore(),
      random: fixedRandom,
      generateId: sequentialIds(),
    });
    await controller.load();

    expect(await controller.submit({ side: "master", as: "gm", text })).toBe(message);
    expect(controller.getSnapshot().events).toHaveLength(1);
  });

  it("추가한 캐릭터는 화자 목록에 나타나고, 그 이름으로 말한 기록이 남으며, 다시 불러와도 있다", async () => {
    const eventLog = createMemoryEventLogStore();
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog,
      random: fixedRandom,
      generateId: sequentialIds(),
    });
    await controller.load();

    expect(await controller.addCharacter({ name: " 경비병 " })).toBeUndefined();
    const guard = { id: "character-1" };
    expect(
      await controller.submit({ side: "master", as: guard.id, text: "멈춰라" }),
    ).toBeUndefined();
    await controller.idle();

    const reloaded = await createSessionController({
      sessionId: "s-1",
      eventLog,
      random: fixedRandom,
      generateId: sequentialIds(),
    }).load();
    expect(reloaded.characters.at(-1)).toStrictEqual({
      id: "character-1",
      name: "경비병",
      archived: false,
      isDefault: false,
    });
    expect(reloaded.characters).toStrictEqual(controller.getSnapshot().characters);
    expect(reloaded.entries.map((entry) => entry.speakerName)).toStrictEqual(["경비병"]);
  });

  it("보관한 캐릭터는 더 말할 수 없지만 지난 기록의 이름은 그대로 보인다", async () => {
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: createMemoryEventLogStore(),
      random: fixedRandom,
      generateId: sequentialIds(),
    });
    await controller.load();
    await controller.addCharacter({ name: "경비병" });
    const guard = { id: "character-1" };
    await controller.submit({ side: "master", as: guard.id, text: "멈춰라" });

    expect(await controller.archiveCharacter(guard.id)).toBeUndefined();

    const { characters, entries } = controller.getSnapshot();
    expect(characters.find(({ id }) => id === guard.id)?.archived).toBe(true);
    expect(entries.map((entry) => entry.speakerName)).toStrictEqual(["경비병"]);
    expect(await controller.submit({ side: "master", as: guard.id, text: "또 멈춰라" })).toBe(
      "말할 수 없는 캐릭터입니다",
    );
  });

  it("규칙을 어긴 캐릭터 추가와 보관은 오류 메시지를 돌려주고 로그에 아무것도 남기지 않는다", async () => {
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: createMemoryEventLogStore(),
      random: fixedRandom,
      generateId: sequentialIds(),
    });
    await controller.load();
    await controller.addCharacter({ name: "경비병" });
    await controller.idle();
    const before = controller.getSnapshot();

    expect(await controller.addCharacter({ name: "경비병" })).toBe(
      "같은 이름의 캐릭터가 이미 있습니다",
    );
    expect(await controller.addCharacter({ name: "  " })).toBe("내용을 입력해주세요");
    expect(await controller.archiveCharacter("gm")).toBe("기본 캐릭터는 보관할 수 없습니다");
    expect(controller.getSnapshot()).toBe(before);
  });

  it("제출 직후 저장이 끝나기 전에는 새 이벤트가 pending이고, 끝나면 committed가 된다", async () => {
    const log = createFakeEventLog();
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: log.store,
      random: fixedRandom,
      generateId: sequentialIds(),
    });
    await controller.load();
    log.hold();

    const submitting = controller.submit({ side: "master", as: "gm", text: "문이 열린다" });
    expect(controller.getSnapshot().entries.map((entry) => entry.status)).toStrictEqual([
      "pending",
    ]);

    log.releaseNext();
    await submitting;
    await controller.idle();
    expect(controller.getSnapshot().entries.map((entry) => entry.status)).toStrictEqual([
      "committed",
    ]);
  });

  it("저장이 실패한 이벤트는 failed로 남고, 이미 저장된 이벤트는 그대로 committed다", async () => {
    const log = createFakeEventLog();
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: log.store,
      random: fixedRandom,
      generateId: sequentialIds(),
    });
    await controller.load();
    await controller.submit({ side: "master", as: "gm", text: "저장되는 기록" });
    log.failNext(new Error("네트워크 오류"));

    const result = await controller.submit({ side: "master", as: "gm", text: "저장 못 하는 기록" });
    await controller.idle();

    expect(result).toBeUndefined();
    expect(
      controller
        .getSnapshot()
        .entries.map((entry) => [entry.status, entry.kind === "message" && entry.content]),
    ).toStrictEqual([
      ["committed", "저장되는 기록"],
      ["failed", "저장 못 하는 기록"],
    ]);
  });

  it("저장을 기다리는 중에 이어 제출한 세 기록은 순서대로 하나씩 저장된다", async () => {
    const log = createFakeEventLog();
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: log.store,
      random: fixedRandom,
      generateId: sequentialIds(),
    });
    await controller.load();
    log.hold();
    const statuses = () => controller.getSnapshot().entries.map((entry) => entry.status);

    const submissions = ["첫째", "둘째", "셋째"].map((text) =>
      controller.submit({ side: "master", as: "gm", text }),
    );
    expect(statuses()).toStrictEqual(["pending", "pending", "pending"]);

    log.releaseNext();
    log.releaseNext();
    log.releaseNext();
    await Promise.all(submissions);
    await controller.idle();

    expect(statuses()).toStrictEqual(["committed", "committed", "committed"]);
    expect(log.mostAtOnce).toBe(1);
    expect(
      (await log.otherTab.read("s-1")).map((event) => [event.version, event.body]),
    ).toStrictEqual([
      [1, { characters: DEFAULT_CHARACTERS }],
      [2, { side: "master", as: "gm", content: "첫째" }],
      [3, { side: "master", as: "gm", content: "둘째" }],
      [4, { side: "master", as: "gm", content: "셋째" }],
    ]);
  });

  it("앞의 저장이 실패하면 뒤에서 기다리던 기록은 저장하지 않고 모두 failed로 남는다", async () => {
    const log = createFakeEventLog();
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: log.store,
      random: fixedRandom,
      generateId: sequentialIds(),
    });
    await controller.load();
    log.hold();
    log.failNext(new Error("네트워크 오류"));

    const submissions = ["첫째", "둘째", "셋째"].map((text) =>
      controller.submit({ side: "master", as: "gm", text }),
    );
    log.releaseNext();
    log.releaseNext();
    log.releaseNext();
    await Promise.all(submissions);
    await controller.idle();

    expect(controller.getSnapshot().entries.map((entry) => entry.status)).toStrictEqual([
      "failed",
      "failed",
      "failed",
    ]);
    expect(await log.otherTab.read("s-1")).toHaveLength(1);
  });

  it("제출은 저장을 기다리지 않고 곧바로 돌아오며, 저장은 뒤에서 끝난다", async () => {
    const log = createFakeEventLog();
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: log.store,
      random: fixedRandom,
      generateId: sequentialIds(),
    });
    await controller.load();
    log.hold();

    // 저장이 풀리지 않았는데도 돌아와야 한다. 저장을 기다린다면 이 테스트는 제한 시간에 걸린다.
    const result = await controller.submit({ side: "master", as: "gm", text: "문이 열린다" });

    expect(result).toBeUndefined();
    expect(controller.getSnapshot().entries.map((entry) => entry.status)).toStrictEqual([
      "pending",
    ]);
    log.releaseNext();
    await controller.idle();
    expect(controller.getSnapshot().entries.map((entry) => entry.status)).toStrictEqual([
      "committed",
    ]);
  }, 1000);

  it("다른 탭이 먼저 기록했다면 최신 로그를 다시 불러오고, 버려진 제출의 글을 그 편에 되돌려 준다", async () => {
    const log = createFakeEventLog();
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: log.store,
      random: fixedRandom,
      generateId: sequentialIds(),
    });
    await controller.load();
    await log.otherTab.append("s-1", 1, [postedEvent("s-1", 2, "다른 탭")]);

    await controller.submit({ side: "player", as: "player", text: " 내 기록 " });
    await controller.idle();

    const { entries, restored } = controller.getSnapshot();
    expect(
      entries.map((entry) => [entry.status, entry.kind === "message" && entry.content]),
    ).toStrictEqual([["committed", "다른 탭"]]);
    expect(restored).toStrictEqual({ player: { key: 1, as: "player", text: " 내 기록 " } });
  });

  it("충돌이 나면 뒤에서 기다리던 제출도 저장하지 않고 버리며, 버려진 글은 줄바꿈으로 이어 돌려준다", async () => {
    const log = createFakeEventLog();
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: log.store,
      random: fixedRandom,
      generateId: sequentialIds(),
    });
    await controller.load();
    await log.otherTab.append("s-1", 1, [postedEvent("s-1", 2, "다른 탭")]);
    log.hold();

    await controller.submit({ side: "player", as: "player", text: "첫째" });
    await controller.submit({ side: "player", as: "player", text: "둘째" });
    log.releaseNext();
    log.releaseNext();
    await controller.idle();

    expect((await log.otherTab.read("s-1")).map((event) => event.version)).toStrictEqual([1, 2]);
    const { entries, restored } = controller.getSnapshot();
    expect(entries.map((entry) => entry.status)).toStrictEqual(["committed"]);
    expect(restored.player?.text).toBe("첫째\n둘째");
  });

  it("저장에 실패한 뒤 다음 제출은 서버의 로그를 다시 불러온 위에서 저장되고, 실패한 기록은 사라진다", async () => {
    const log = createFakeEventLog();
    const controller = createSessionController({
      sessionId: "s-1",
      eventLog: log.store,
      random: fixedRandom,
      generateId: sequentialIds(),
    });
    await controller.load();
    log.failNext(new Error("네트워크 오류"));
    await controller.submit({ side: "master", as: "gm", text: "저장 못 하는 기록" });
    await controller.idle();
    expect(controller.getSnapshot().entries.map((entry) => entry.status)).toStrictEqual(["failed"]);

    await controller.submit({ side: "master", as: "gm", text: "다시 쓴 기록" });
    await controller.idle();

    expect(
      controller
        .getSnapshot()
        .entries.map((entry) => [entry.status, entry.kind === "message" && entry.content]),
    ).toStrictEqual([["committed", "다시 쓴 기록"]]);
    expect((await log.otherTab.read("s-1")).map((event) => event.version)).toStrictEqual([1, 2]);
  });
});
