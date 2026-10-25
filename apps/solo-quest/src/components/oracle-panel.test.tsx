import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import type { OracleRoll } from "./oracle-panel.tsx";
import { OraclePanel } from "./oracle-panel.tsx";
import * as Stories from "./oracle-panel.stories.tsx";

describe("OraclePanel", () => {
  it("열면 오라클마다 이름과 주사위가 보인다", async () => {
    await runSiheom(
      given.render(<OraclePanel {...Stories.Seeded.args} />),
      actions.click(query.button("오라클 4")),
      assertions.visible(query.dialog("오라클")),
      assertions.textContents(query.list("오라클 목록"), [
        "행동d100",
        "문제d100",
        "날씨d6",
        "이름d6",
      ]),
    );
  });

  it("검색어로 이름을 걸러 낸다", async () => {
    await runSiheom(
      given.render(<OraclePanel {...Stories.Seeded.args} />),
      actions.click(query.button("오라클 4")),
      actions.fill(query.textbox("오라클 검색"), "문제"),
      assertions.textContents(query.list("오라클 목록"), ["문제d100"]),
      actions.fill(query.textbox("오라클 검색"), "없는말"),
      assertions.textContent(query.status("오라클 없음"), "찾는 오라클이 없습니다"),
    );
  });

  it("굴리기 버튼은 패널에서 고른 편과 화자로 굴린다", async () => {
    let rolled: OracleRoll | undefined;

    await runSiheom(
      given.render(
        <OraclePanel
          {...Stories.Seeded.args}
          onRoll={async (values) => {
            rolled = values;
            return undefined;
          }}
        />,
      ),
      actions.click(query.button("오라클 4")),
      actions.click(query.button("행동 굴리기")),
    );

    expect(rolled).toStrictEqual({ side: "player", as: "player", oracleId: "action" });
  });

  it("편과 화자를 바꾸면 그 값으로 굴린다", async () => {
    let rolled: OracleRoll | undefined;

    await runSiheom(
      given.render(
        <OraclePanel
          {...Stories.WithMacro.args}
          onRoll={async (values) => {
            rolled = values;
            return undefined;
          }}
        />,
      ),
      actions.click(query.button("오라클 4")),
      actions.click(query.combobox("굴릴 편")),
      actions.click(query.option("마스터")),
      assertions.not.expanded(query.combobox("굴릴 편")),
      actions.click(query.combobox("굴릴 화자")),
      actions.click(query.option("경비병")),
      assertions.not.expanded(query.combobox("굴릴 화자")),
      actions.click(query.button("문제 굴리기")),
    );

    expect(rolled).toStrictEqual({ side: "master", as: "guard", oracleId: "trouble" });
  });

  it("매크로 등록을 누르면 그 오라클 id가 넘어가고, 이미 등록한 오라클은 해제한다", async () => {
    let added: string | undefined;
    let removed: string | undefined;

    await runSiheom(
      given.render(
        <OraclePanel
          {...Stories.WithMacro.args}
          onAddMacro={async (oracleId) => {
            added = oracleId;
            return undefined;
          }}
          onRemoveMacro={async (macroId) => {
            removed = macroId;
            return undefined;
          }}
        />,
      ),
      actions.click(query.button("오라클 4")),
      actions.click(query.button("문제 매크로 등록")),
      actions.click(query.button("행동 매크로 해제")),
    );

    expect(added).toBe("trouble");
    expect(removed).toBe("om-1");
  });

  it("표를 고치는 일은 세션 패널에 없고, 관리 페이지로 가는 링크만 있다", async () => {
    await runSiheom(
      given.render(<OraclePanel {...Stories.Seeded.args} />),
      actions.click(query.button("오라클 4")),
      assertions.not.visible(query.button("행동 편집")),
      assertions.not.visible(query.button("행동 삭제")),
      assertions.visible(query.link("오라클 관리")),
      assertions.href(query.link("오라클 관리"), "/oracles"),
    );
  });
});
