import { describe, expect, it } from "vitest";

import { createMemoryEventLogStore } from "./event-log-store.ts";
import { createEventLogAdapter } from "./event-log-adapter.ts";
import type { RollResult } from "./dice.ts";
import { createSessionRepository, DEFAULT_CHARACTERS, RuleViolation, Session } from "./session.ts";

const rolled = {
  terms: [
    { type: "dice", sign: 1, sides: 6, values: [4, 6] },
    { type: "constant", sign: 1, value: 1 },
  ],
  total: 11,
} satisfies RollResult;

const startSession = () =>
  Session.create({ entityId: "session-1", body: { characters: DEFAULT_CHARACTERS } });

describe("세션", () => {
  it("새 세션을 시작하면 활성 기본 캐릭터 GM과 Player가 있다", () => {
    const session = startSession();

    expect(session.state.characters).toStrictEqual([
      { id: "gm", name: "GM", archived: false, isDefault: true },
      { id: "player", name: "Player", archived: false, isDefault: true },
    ]);
  });

  it("대화를 남기면 이벤트가 하나 늘고 캐릭터 목록은 그대로다", () => {
    const session = startSession();
    const before = session.state;

    session.postMessage("master", "gm", "문이 열린다");
    session.postMessage("player", "player", "안으로 들어간다");

    expect(session.version).toBe(3);
    expect(session.state).toStrictEqual(before);
  });

  it.each([
    ["빈 대화", "gm", ""],
    ["공백만 있는 대화", "gm", "  \n "],
    ["141자 대화", "gm", "가".repeat(141)],
    ["없는 화자의 대화", "아무도-아님", "안녕"],
  ])("%s는 이벤트를 만들지 않고 오류를 낸다", (_name, speakerId, text) => {
    const session = startSession();

    expect(() => session.postMessage("master", speakerId, text)).toThrow(RuleViolation);
    expect(session.version).toBe(1);
  });

  it("마스터와 플레이어 편 대화를 커밋하고 다시 불러오면 이벤트의 순서와 본문이 같다", async () => {
    const store = createMemoryEventLogStore();
    const repository = createSessionRepository(createEventLogAdapter(store));
    const session = startSession();
    session.postMessage("master", "gm", "문이 열린다\n안은 어둡다");
    session.postMessage("player", "player", "안으로 들어간다");

    await repository.commit(session);
    const reloaded = await repository.findOne({ entityId: "session-1" });

    expect(reloaded?.version).toBe(3);
    expect(reloaded?.state).toStrictEqual(session.state);
    expect(
      (await store.read("session-1")).map(({ version, eventName, body }) => ({
        version,
        eventName,
        body,
      })),
    ).toStrictEqual([
      { version: 1, eventName: "session:started", body: { characters: DEFAULT_CHARACTERS } },
      {
        version: 2,
        eventName: "session:message_posted",
        body: { side: "master", as: "gm", content: "문이 열린다\n안은 어둡다" },
      },
      {
        version: 3,
        eventName: "session:message_posted",
        body: { side: "player", as: "player", content: "안으로 들어간다" },
      },
    ]);
  });

  it("판정을 남기면 이벤트가 하나 늘고 캐릭터 목록은 그대로다", () => {
    const session = startSession();
    const before = session.state;

    session.rollDice("player", "player", "2d6+1", rolled, "자물쇠 따기");
    session.rollDice("master", "gm", "2d6+1", rolled);

    expect(session.version).toBe(3);
    expect(session.state).toStrictEqual(before);
  });

  it.each([
    ["141자 라벨의 판정", "gm", "가".repeat(141)],
    ["공백뿐인 라벨의 판정", "gm", "   "],
    ["없는 화자의 판정", "아무도-아님", "자물쇠 따기"],
  ])("%s은 이벤트를 만들지 않고 오류를 낸다", (_name, speakerId, label) => {
    const session = startSession();

    expect(() => session.rollDice("master", speakerId, "2d6+1", rolled, label)).toThrow(
      RuleViolation,
    );
    expect(session.version).toBe(1);
  });

  it("판정을 커밋하고 다시 불러오면 굴린 결과가 그대로다(다시 굴리지 않는다)", async () => {
    const store = createMemoryEventLogStore();
    const repository = createSessionRepository(createEventLogAdapter(store));
    const session = startSession();
    session.rollDice("player", "player", "2d6+1", rolled, " 자물쇠 따기 ");
    session.rollDice("master", "gm", "2d6+1", rolled);

    await repository.commit(session);
    const reloaded = await repository.findOne({ entityId: "session-1" });

    expect(reloaded?.version).toBe(3);
    expect(reloaded?.state).toStrictEqual(session.state);
    expect((await store.read("session-1")).slice(1).map(({ body }) => body)).toStrictEqual([
      { side: "player", as: "player", notation: "2d6+1", ...rolled, label: "자물쇠 따기" },
      { side: "master", as: "gm", notation: "2d6+1", ...rolled },
    ]);
  });

  it("캐릭터를 추가하면 앞뒤 공백을 뺀 이름의 활성 캐릭터가 목록 끝에 생기고, 커밋하고 다시 불러와도 같다", async () => {
    const repository = createSessionRepository(createEventLogAdapter(createMemoryEventLogStore()));
    const session = startSession();

    session.addCharacter(" 경비병 ");
    await repository.commit(session);
    const reloaded = await repository.findOne({ entityId: "session-1" });

    expect(session.version).toBe(2);
    expect(session.state.characters.slice(0, 2)).toStrictEqual(DEFAULT_CHARACTERS);
    expect(session.state.characters.slice(2)).toStrictEqual([
      { id: expect.any(String), name: "경비병", archived: false, isDefault: false },
    ]);
    expect(reloaded?.state).toStrictEqual(session.state);
  });

  it.each([
    ["빈 이름", ""],
    ["공백뿐인 이름", "  \n "],
    ["141자 이름", "가".repeat(141)],
  ])("%s의 캐릭터는 이벤트를 만들지 않고 오류를 낸다", (_name, name) => {
    const session = startSession();

    expect(() => session.addCharacter(name)).toThrow(RuleViolation);
    expect(session.version).toBe(1);
    expect(session.state.characters).toStrictEqual(DEFAULT_CHARACTERS);
  });
});
