import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { SIDE_LABEL } from "./side-label.ts";
import type { OracleRollValues } from "./oracle-button.tsx";
import { MessageInput, type MacroRollValues, type MessageValues } from "./message-input.tsx";
import * as Stories from "./message-input.stories.tsx";

describe("MessageInput", () => {
  it("텍스트를 넣고 남기면 편과 화자와 앞뒤 공백을 뺀 텍스트가 제출되고 입력이 비워진다", async () => {
    let result: MessageValues | undefined;

    await runSiheom(
      given.render(
        <MessageInput
          {...Stories.Master.args}
          onSubmit={async (values) => {
            result = values;
            return undefined;
          }}
        />,
      ),
      actions.fill(query.textbox("마스터 대화"), "  문이 열린다\n안은 어둡다 "),
      actions.click(query.button("마스터로 남기기")),
      assertions.value(query.textbox("마스터 대화"), ""),
    );

    expect(result).toStrictEqual({ side: "master", as: "gm", text: "문이 열린다\n안은 어둡다" });
  });

  it("대화를 치고 Enter를 누르면 바로 남겨진다", async () => {
    let result: MessageValues | undefined;

    await runSiheom(
      given.render(
        <MessageInput
          {...Stories.Master.args}
          onSubmit={async (values) => {
            result = values;
            return undefined;
          }}
        />,
      ),
      actions.type(query.textbox("마스터 대화"), "문이 열린다{Enter}"),
      assertions.value(query.textbox("마스터 대화"), ""),
    );

    expect(result).toStrictEqual({ side: "master", as: "gm", text: "문이 열린다" });
  });

  it("onSubmit이 오류를 돌려주면 입력이 남고 아래에 오류가 보인다", async () => {
    await runSiheom(
      given.render(
        <MessageInput
          {...Stories.Master.args}
          onSubmit={async () => "다른 곳에서 먼저 기록했습니다"}
        />,
      ),
      actions.fill(query.textbox("마스터 대화"), "문이 열린다"),
      actions.click(query.button("마스터로 남기기")),
      assertions.value(query.textbox("마스터 대화"), "문이 열린다"),
      assertions.visible(query.alert("다른 곳에서 먼저 기록했습니다")),
    );
  });

  it("남은 글자 수는 20자 이하로 남았을 때부터 보인다", async () => {
    await runSiheom(
      given.render(<MessageInput {...Stories.Master.args} />),
      assertions.not.visible(query.status("마스터 남은 글자 수")),
      actions.fill(query.textbox("마스터 대화"), "가".repeat(119)),
      assertions.not.visible(query.status("마스터 남은 글자 수")),
      actions.fill(query.textbox("마스터 대화"), "가".repeat(120)),
      assertions.textContent(query.status("마스터 남은 글자 수"), "20"),
    );
  });

  it("빈 입력과 공백만 있는 입력은 제출되지 않고 오류가 보인다", async () => {
    let result: MessageValues | undefined;

    await runSiheom(
      given.render(
        <MessageInput
          {...Stories.Master.args}
          onSubmit={async (values) => {
            result = values;
            return undefined;
          }}
        />,
      ),
      actions.click(query.button("마스터로 남기기")),
      assertions.errormessage(query.textbox("마스터 대화"), "내용을 입력해주세요"),
      actions.fill(query.textbox("마스터 대화"), "   "),
      actions.click(query.button("마스터로 남기기")),
      assertions.errormessage(query.textbox("마스터 대화"), "내용을 입력해주세요"),
    );

    expect(result).toBeUndefined();
  });

  it("140자를 넘으면 제출되지 않고 남은 글자 수가 음수로 보인다", async () => {
    let result: MessageValues | undefined;

    await runSiheom(
      given.render(
        <MessageInput
          {...Stories.Master.args}
          onSubmit={async (values) => {
            result = values;
            return undefined;
          }}
        />,
      ),
      actions.fill(query.textbox("마스터 대화"), "가".repeat(141)),
      assertions.textContent(query.status("마스터 남은 글자 수"), "-1"),
      actions.click(query.button("마스터로 남기기")),
      assertions.errormessage(query.textbox("마스터 대화"), "140자 이하로 입력해주세요"),
    );

    expect(result).toBeUndefined();
  });

  it("기본 화자가 골라져 있고, 다른 캐릭터를 고르면 그 화자로 제출되며, 제출한 뒤에도 화자가 유지된다", async () => {
    let result: MessageValues | undefined;

    await runSiheom(
      given.render(
        <MessageInput
          {...Stories.Master.args}
          onSubmit={async (values) => {
            result = values;
            return undefined;
          }}
        />,
      ),
      assertions.textContent(query.combobox("마스터 화자"), "GM"),
      actions.fill(query.textbox("마스터 대화"), "안으로 들어간다"),
      actions.click(query.combobox("마스터 화자")),
      actions.click(query.option("Player")),
      assertions.not.expanded(query.combobox("마스터 화자")),
      assertions.value(query.textbox("마스터 대화"), "안으로 들어간다"),
      actions.click(query.button("마스터로 남기기")),
      assertions.value(query.textbox("마스터 대화"), ""),
      assertions.textContent(query.combobox("마스터 화자"), "Player"),
    );

    expect(result).toStrictEqual({ side: "master", as: "player", text: "안으로 들어간다" });
  });

  it("화자 목록에는 활성 캐릭터만 나오고, 고른 캐릭터로 제출된다", async () => {
    let result: MessageValues | undefined;

    await runSiheom(
      given.render(
        <MessageInput
          {...Stories.WithArchived.args}
          onSubmit={async (values) => {
            result = values;
            return undefined;
          }}
        />,
      ),
      actions.fill(query.textbox("마스터 대화"), "멈춰라"),
      actions.click(query.combobox("마스터 화자")),
      // 보관된 상인은 목록에 없다
      assertions.textContents(query.listbox("마스터 화자"), ["GM", "Player", "경비병"]),
      actions.click(query.option("경비병")),
      assertions.not.expanded(query.combobox("마스터 화자")),
      actions.click(query.button("마스터로 남기기")),
      assertions.value(query.textbox("마스터 대화"), ""),
    );

    expect(result).toStrictEqual({ side: "master", as: "guard", text: "멈춰라" });
  });

  it.each([
    ["master", "GM"],
    ["player", "Player"],
  ] as const)(
    "고른 화자가 보관되면 %s 입력창의 화자는 그 편의 기본 캐릭터로 돌아가고 쓰던 글은 남는다",
    async (side, defaultName) => {
      const label = SIDE_LABEL[side];

      await runSiheom(
        given.render(<Stories.GuardGetsArchived side={side} />),
        actions.fill(query.textbox(`${label} 대화`), "쓰던 글"),
        actions.click(query.combobox(`${label} 화자`)),
        actions.click(query.option("경비병")),
        assertions.not.expanded(query.combobox(`${label} 화자`)),
        assertions.textContent(query.combobox(`${label} 화자`), "경비병"),
        actions.click(query.button("경비병 보관")),
        assertions.textContent(query.combobox(`${label} 화자`), defaultName),
        assertions.value(query.textbox(`${label} 대화`), "쓰던 글"),
      );
    },
  );

  it("충돌로 버려진 글이 돌아오면 그 글과 화자가 채워진다", async () => {
    await runSiheom(
      given.render(<MessageInput {...Stories.Restored.args} onSubmit={async () => undefined} />),
      assertions.value(query.textbox("마스터 대화"), "되돌아온 글"),
      assertions.textContent(query.combobox("마스터 화자"), "경비병"),
    );
  });

  it("글이 돌아올 때 입력창에 새로 쓰던 글이 있으면 덮어쓰지 않는다", async () => {
    await runSiheom(
      given.render(<Stories.RestoredLater side="master" />),
      actions.fill(query.textbox("마스터 대화"), "새로 쓰던 글"),
      actions.click(query.button("글 되돌리기")),
      assertions.value(query.textbox("마스터 대화"), "새로 쓰던 글"),
    );
  });

  it("입력창이 비어 있을 때 글이 돌아오면 채워진다", async () => {
    await runSiheom(
      given.render(<Stories.RestoredLater side="master" />),
      actions.click(query.button("글 되돌리기")),
      assertions.value(query.textbox("마스터 대화"), "되돌아온 글"),
    );
  });

  it("매크로 버튼으로 빈칸을 고르고 굴리면 편, 화자, 매크로, 고른 값이 넘어가고 대화는 남지 않는다", async () => {
    let rolled: MacroRollValues | undefined;
    let posted: MessageValues | undefined;

    await runSiheom(
      given.render(
        <MessageInput
          {...Stories.WithMacros.args}
          onSubmit={async (values) => {
            posted = values;
            return undefined;
          }}
          onRollMacro={async (values) => {
            rolled = values;
            return undefined;
          }}
        />,
      ),
      actions.click(query.combobox("플레이어 화자")),
      actions.click(query.option("경비병")),
      assertions.not.expanded(query.combobox("플레이어 화자")),
      // 쓰던 대화가 있어도 매크로 굴림은 대화를 남기지 않고 글을 그대로 둔다
      actions.fill(query.textbox("플레이어 대화"), "숲으로 들어간다"),
      actions.click(query.button("행동 판정")),
      assertions.visible(query.dialog("행동 판정")),
      actions.click(query.combobox("능력치")),
      actions.click(query.option("3")),
      assertions.not.expanded(query.combobox("능력치")),
      actions.click(query.combobox("수정치")),
      actions.click(query.option("2")),
      assertions.not.expanded(query.combobox("수정치")),
      actions.click(query.button("굴리기")),
      assertions.not.visible(query.dialog("행동 판정")),
      assertions.value(query.textbox("플레이어 대화"), "숲으로 들어간다"),
    );

    expect(rolled).toStrictEqual({
      side: "player",
      as: "guard",
      macroId: "ironsworn",
      values: { 능력치: 3, 수정치: 2 },
    });
    expect(posted).toBeUndefined();
  });

  it("매크로 빈칸은 처음에 최솟값이고, 라벨을 적으면 함께 넘어간다", async () => {
    let rolled: MacroRollValues | undefined;

    await runSiheom(
      given.render(
        <MessageInput
          {...Stories.WithMacros.args}
          onRollMacro={async (values) => {
            rolled = values;
            return undefined;
          }}
        />,
      ),
      actions.click(query.button("과제 판정")),
      assertions.textContent(query.combobox("난이도"), "0"),
      actions.fill(query.textbox("판정 라벨"), "자물쇠 따기"),
      actions.click(query.button("굴리기")),
    );

    expect(rolled).toStrictEqual({
      side: "player",
      as: "player",
      macroId: "cypher",
      values: { 난이도: 0 },
      label: "자물쇠 따기",
    });
  });

  it("매크로 굴림이 오류를 돌려주면 폼이 열린 채 오류가 보인다", async () => {
    await runSiheom(
      given.render(
        <MessageInput
          {...Stories.WithMacros.args}
          onRollMacro={async () => "말할 수 없는 캐릭터입니다"}
        />,
      ),
      actions.click(query.button("위험을 무릅쓰기")),
      actions.click(query.button("굴리기")),
      assertions.visible(query.alert("말할 수 없는 캐릭터입니다")),
      assertions.visible(query.dialog("위험을 무릅쓰기")),
    );
  });

  it("오라클 버튼을 누르면 그 입력창에서 고른 편과 화자로 굴리고, 대화는 남지 않는다", async () => {
    let rolled: OracleRollValues | undefined;
    let posted: MessageValues | undefined;

    await runSiheom(
      given.render(
        <MessageInput
          {...Stories.WithOracles.args}
          onSubmit={async (values) => {
            posted = values;
            return undefined;
          }}
          onRollOracle={async (values) => {
            rolled = values;
            return undefined;
          }}
        />,
      ),
      actions.fill(query.textbox("플레이어 대화"), "숲으로 들어간다"),
      actions.click(query.combobox("플레이어 화자")),
      actions.click(query.option("경비병")),
      assertions.not.expanded(query.combobox("플레이어 화자")),
      actions.click(query.button("행동 굴리기")),
      assertions.value(query.textbox("플레이어 대화"), "숲으로 들어간다"),
    );

    expect(rolled).toStrictEqual({ side: "player", as: "guard", oracleId: "action" });
    expect(posted).toBeUndefined();
  });

  it("오라클 굴림이 오류를 돌려주면 버튼 옆에 오류가 보인다", async () => {
    await runSiheom(
      given.render(
        <MessageInput
          {...Stories.WithOracles.args}
          onRollOracle={async () => "말할 수 없는 캐릭터입니다"}
        />,
      ),
      actions.click(query.button("행동 굴리기")),
      assertions.visible(query.alert("말할 수 없는 캐릭터입니다")),
    );
  });

  it("지워진 오라클은 누를 수 없는 없는 오라클 버튼으로 보인다", async () => {
    await runSiheom(
      given.render(
        <MessageInput
          {...Stories.WithOracles.args}
          oracleMacros={[{ id: "om-2", oracleId: "없는-오라클" }]}
          onRollOracle={async () => undefined}
        />,
      ),
      assertions.visible(query.button("없는 오라클")),
    );
  });
});
