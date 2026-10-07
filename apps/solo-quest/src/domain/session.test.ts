import { describe, expect, it } from "vitest";

import { DEFAULT_CHARACTERS, RuleViolation, Session } from "./session.ts";

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
});
