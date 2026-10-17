import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { SYSTEM_MACROS } from "../domain/macro.fixture.ts";
import { MacroPanel } from "./macro-panel.tsx";
import * as Stories from "./macro-panel.stories.tsx";

/** user-event 키보드 문법에서 `{`, `[`는 특수 키를 여는 글자라, 글자 그대로 치려면 두 번 적는다. */
const literal = (text: string) => text.replaceAll("{", "{{").replaceAll("[", "[[");

describe("MacroPanel", () => {
  it("열면 매크로마다 이름과 식이 보인다", async () => {
    await runSiheom(
      given.render(<MacroPanel {...Stories.Systems.args} />),
      actions.click(query.button("매크로 5")),
      assertions.visible(query.dialog("매크로")),
      assertions.textContents(query.list("매크로 목록"), [
        `행동 판정${SYSTEM_MACROS.ironsworn}`,
        `과제 판정${SYSTEM_MACROS.cypher}`,
        `성공 판정${SYSTEM_MACROS.gurps}`,
        `Fate 행동${SYSTEM_MACROS.fate}`,
        `위험을 무릅쓰기${SYSTEM_MACROS.dungeonWorld}`,
      ]),
    );
  });

  it("삭제 버튼을 누르면 onRemove에 그 매크로 id가 넘어간다", async () => {
    let removed: string | undefined;

    await runSiheom(
      given.render(
        <MacroPanel
          {...Stories.Systems.args}
          onRemove={async (macroId) => {
            removed = macroId;
            return undefined;
          }}
        />,
      ),
      actions.click(query.button("매크로 5")),
      actions.click(query.button("과제 판정 삭제")),
    );

    expect(removed).toBe("cypher");
  });

  it("이름과 식을 넣고 추가하면 onAdd에 { name, definition }이 넘어가고 입력이 비워진다", async () => {
    let added: { name: string; definition: string } | undefined;

    await runSiheom(
      given.render(
        <MacroPanel
          {...Stories.Empty.args}
          onAdd={async (values) => {
            added = values;
            return undefined;
          }}
        />,
      ),
      actions.click(query.button("매크로 0")),
      actions.fill(query.textbox("매크로 이름"), " 행동 판정 "),
      actions.fill(query.textbox("매크로 식"), literal(SYSTEM_MACROS.ironsworn)),
      actions.click(query.button("매크로 추가")),
      assertions.value(query.textbox("매크로 이름"), ""),
      assertions.value(query.textbox("매크로 식"), ""),
    );

    expect(added).toStrictEqual({ name: "행동 판정", definition: SYSTEM_MACROS.ironsworn });
  });

  it("onAdd가 오류를 돌려주면 입력이 남고 오류가 보인다", async () => {
    await runSiheom(
      given.render(
        <MacroPanel
          {...Stories.Empty.args}
          onAdd={async () => "주사위 표기가 올바르지 않습니다: 2x6"}
        />,
      ),
      actions.click(query.button("매크로 0")),
      actions.fill(query.textbox("매크로 이름"), "잘못된 매크로"),
      actions.fill(query.textbox("매크로 식"), "2x6"),
      actions.click(query.button("매크로 추가")),
      assertions.value(query.textbox("매크로 식"), "2x6"),
      assertions.visible(query.alert("주사위 표기가 올바르지 않습니다: 2x6")),
    );
  });
});
