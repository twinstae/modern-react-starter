import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import type { Oracle } from "../domain/oracle.ts";
import type { OracleRoll } from "./oracle-panel.tsx";
import { OraclePanel } from "./oracle-panel.tsx";
import * as Stories from "./oracle-panel.stories.tsx";

describe("OraclePanel", () => {
  it("열면 오라클마다 이름과 주사위가 보인다", async () => {
    await runSiheom(
      given.render(<OraclePanel {...Stories.Seeded.args} />),
      actions.click(query.button("오라클 3")),
      assertions.visible(query.dialog("오라클")),
      assertions.textContents(query.list("오라클 목록"), ["행동d100", "문제d100", "날씨d6"]),
    );
  });

  it("검색어로 이름을 걸러 낸다", async () => {
    await runSiheom(
      given.render(<OraclePanel {...Stories.Seeded.args} />),
      actions.click(query.button("오라클 3")),
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
      actions.click(query.button("오라클 3")),
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
      actions.click(query.button("오라클 3")),
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
      actions.click(query.button("오라클 3")),
      actions.click(query.button("문제 매크로 등록")),
      actions.click(query.button("행동 매크로 해제")),
    );

    expect(added).toBe("trouble");
    expect(removed).toBe("om-1");
  });

  it("편집을 누르면 그 오라클의 값이 채워지고, 고쳐 저장하면 넘어간다", async () => {
    let saved: Oracle | undefined;

    await runSiheom(
      given.render(
        <OraclePanel
          {...Stories.Seeded.args}
          onSave={async (oracle) => {
            saved = oracle;
            return undefined;
          }}
        />,
      ),
      actions.click(query.button("오라클 3")),
      actions.click(query.button("행동 편집")),
      assertions.visible(query.dialog("오라클 편집")),
      assertions.value(query.textbox("오라클 이름"), "행동"),
      actions.fill(query.textbox("1번째 줄 결과"), "꾸민다 (고침)"),
      actions.click(query.button("저장")),
      assertions.not.visible(query.dialog("오라클 편집")),
    );

    expect(saved).toMatchObject({
      id: "action",
      name: "행동",
      sides: 100,
      rows: [
        { min: 1, max: 50, result: "꾸민다 (고침)" },
        { min: 51, max: 100, result: "불러낸다" },
      ],
    });
  });

  it("표가 1부터 끝까지 이어지지 않으면 저장하지 않고 이유를 보여 준다", async () => {
    let saved: Oracle | undefined;

    await runSiheom(
      given.render(
        <OraclePanel
          {...Stories.Seeded.args}
          onSave={async (oracle) => {
            saved = oracle;
            return undefined;
          }}
        />,
      ),
      actions.click(query.button("오라클 3")),
      actions.click(query.button("행동 편집")),
      actions.fill(query.spinbutton("1번째 줄 끝"), "40"),
      actions.click(query.button("저장")),
      assertions.visible(query.alert("범위가 이어지지 않습니다: 41")),
    );

    expect(saved).toBeUndefined();
  });

  it("새 오라클은 주사위와 줄을 고쳐 저장할 수 있다", async () => {
    let saved: Oracle | undefined;

    await runSiheom(
      given.render(
        <OraclePanel
          {...Stories.Seeded.args}
          onSave={async (oracle) => {
            saved = oracle;
            return undefined;
          }}
        />,
      ),
      actions.click(query.button("오라클 3")),
      actions.click(query.button("새 오라클")),
      assertions.visible(query.dialog("새 오라클")),
      actions.fill(query.textbox("오라클 이름"), "날씨"),
      actions.click(query.combobox("주사위")),
      actions.click(query.option("d6")),
      assertions.not.expanded(query.combobox("주사위")),
      actions.fill(query.spinbutton("1번째 줄 시작"), "1"),
      actions.fill(query.spinbutton("1번째 줄 끝"), "3"),
      actions.fill(query.textbox("1번째 줄 결과"), "맑음"),
      actions.click(query.button("줄 추가")),
      actions.fill(query.textbox("2번째 줄 결과"), "폭풍"),
      actions.click(query.button("저장")),
    );

    expect(saved).toMatchObject({
      name: "날씨",
      sides: 6,
      rows: [
        { min: 1, max: 3, result: "맑음" },
        { min: 4, max: 6, result: "폭풍" },
      ],
    });
  });

  it("삭제를 누르면 그 오라클 id가 넘어간다", async () => {
    let removed: string | undefined;

    await runSiheom(
      given.render(
        <OraclePanel
          {...Stories.Seeded.args}
          onRemove={async (oracleId) => {
            removed = oracleId;
            return undefined;
          }}
        />,
      ),
      actions.click(query.button("오라클 3")),
      actions.click(query.button("행동 삭제")),
    );

    expect(removed).toBe("action");
  });

  it("저장이 오류를 돌려주면 창이 열린 채 오류가 보인다", async () => {
    await runSiheom(
      given.render(
        <OraclePanel
          {...Stories.Seeded.args}
          onSave={async () => "오라클을 저장하지 못했습니다"}
        />,
      ),
      actions.click(query.button("오라클 3")),
      actions.click(query.button("행동 편집")),
      actions.click(query.button("저장")),
      assertions.visible(query.dialog("오라클 편집")),
      assertions.visible(query.alert("오라클을 저장하지 못했습니다")),
    );
  });
});
