import { screen, waitFor } from "@testing-library/dom";
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

  it("추가한 캐릭터의 보관 버튼을 누르면 onArchive에 그 캐릭터 id가 넘어간다", async () => {
    let archived: string | undefined;

    await runSiheom(
      given.render(
        <CharacterPanel
          {...Stories.One.args}
          onArchive={async (characterId) => {
            archived = characterId;
            return undefined;
          }}
        />,
      ),
      actions.click(query.button(/^캐릭터/)),
      actions.click(query.button("경비병 보관")),
    );

    expect(archived).toBe("npc-1");
  });

  it("보관된 캐릭터는 활성 캐릭터와 따로 보이고, 보관 버튼이 없다", async () => {
    await runSiheom(
      given.render(<CharacterPanel {...Stories.WithArchived.args} />),
      actions.click(query.button(/^캐릭터/)),
      assertions.textContent(query.list("활성 캐릭터"), "상인"),
      assertions.textContent(query.list("보관된 캐릭터"), "경비병"),
      // 보관 버튼은 활성 경비병 하나에만 있다
      assertions.count(query.button("경비병 보관"), 1),
      assertions.count(query.listitem("상인"), 1),
    );
  });

  it("이름을 넣고 추가하면 onAdd에 앞뒤 공백을 뺀 { name }이 넘어가고 입력이 비워진다", async () => {
    let added: { name: string } | undefined;

    await runSiheom(
      given.render(
        <CharacterPanel
          {...Stories.DefaultOnly.args}
          onAdd={async (values) => {
            added = values;
            return undefined;
          }}
        />,
      ),
      actions.click(query.button(/^캐릭터/)),
      actions.fill(query.textbox("캐릭터 이름"), "  경비병 "),
      actions.click(query.button("캐릭터 추가")),
      assertions.value(query.textbox("캐릭터 이름"), ""),
    );

    expect(added).toStrictEqual({ name: "경비병" });
  });

  it("onAdd가 오류를 돌려주면 입력이 남고 오류가 보인다", async () => {
    await runSiheom(
      given.render(
        <CharacterPanel
          {...Stories.DefaultOnly.args}
          onAdd={async () => "같은 이름의 캐릭터가 이미 있습니다"}
        />,
      ),
      actions.click(query.button(/^캐릭터/)),
      actions.fill(query.textbox("캐릭터 이름"), "GM"),
      actions.click(query.button("캐릭터 추가")),
      assertions.value(query.textbox("캐릭터 이름"), "GM"),
      assertions.visible(query.alert("같은 이름의 캐릭터가 이미 있습니다")),
    );
  });

  it("onArchive가 오류를 돌려주면 오류가 보이고, 다음에 성공하면 사라진다", async () => {
    let result: string | undefined = "다른 곳에서 먼저 기록했습니다";

    await runSiheom(
      given.render(<CharacterPanel {...Stories.One.args} onArchive={async () => result} />),
      actions.click(query.button(/^캐릭터/)),
      actions.click(query.button("경비병 보관")),
      assertions.visible(query.alert("다른 곳에서 먼저 기록했습니다")),
    );
    result = undefined;
    await runSiheom(actions.click(query.button("경비병 보관")));
    // siheom 0.3.0은 요소가 없음을 확인하지 못해서 직접 기다린다
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  });
});
