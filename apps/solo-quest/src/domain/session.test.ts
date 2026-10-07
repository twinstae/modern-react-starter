import { describe, expect, it } from "vitest";

import { DEFAULT_CHARACTERS, Session } from "./session.ts";

describe("세션", () => {
  it("새 세션을 시작하면 활성 기본 캐릭터 GM과 Player가 있다", () => {
    const session = Session.create({
      entityId: "session-1",
      body: { characters: DEFAULT_CHARACTERS },
    });

    expect(session.state.characters).toStrictEqual([
      { id: "gm", name: "GM", archived: false, isDefault: true },
      { id: "player", name: "Player", archived: false, isDefault: true },
    ]);
  });
});
