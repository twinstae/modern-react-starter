import { screen } from "@testing-library/dom";
import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { SIDE_LABEL } from "./side-label.ts";
import { MessageInput, type MessageValues } from "./message-input.tsx";
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
    // siheom 0.3.0의 not.visible과 count(0)은 요소가 없음을 확인하지 못해서 직접 확인한다
    const remaining = () => screen.queryByRole("status", { name: "마스터 남은 글자 수" });

    await runSiheom(given.render(<MessageInput {...Stories.Master.args} />));
    expect(remaining()).toBeNull();

    await runSiheom(actions.fill(query.textbox("마스터 대화"), "가".repeat(119)));
    expect(remaining()).toBeNull();

    await runSiheom(
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
    // siheom 0.3.0은 요소가 없음을 확인하지 못해서 직접 확인한다
    const optionNamed = (name: string) => screen.queryByRole("option", { name });

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
      assertions.visible(query.option("경비병")),
    );
    expect(optionNamed("GM")).not.toBeNull();
    expect(optionNamed("Player")).not.toBeNull();
    expect(optionNamed("상인")).toBeNull();

    await runSiheom(
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
});
