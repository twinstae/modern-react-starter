import { screen } from "@testing-library/dom";
import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { CharacterPanel } from "./character-panel.tsx";
import * as Stories from "./character-panel.stories.tsx";

describe("CharacterPanel", () => {
  it("열면 활성 캐릭터의 이름이 보이고, 기본 캐릭터에는 보관 버튼이 없다", async () => {
    await runSiheom(
      given.render(<CharacterPanel {...Stories.DefaultOnly.args} />),
      actions.click(query.button(/^캐릭터/)),
      assertions.visible(query.listitem("GM")),
      assertions.visible(query.listitem("Player")),
    );

    expect(screen.queryByRole("button", { name: "GM 보관" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Player 보관" })).toBeNull();
  });
});
