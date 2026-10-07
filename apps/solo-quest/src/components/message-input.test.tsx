import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

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

  it("입력하는 동안 남은 글자 수가 줄어든다", async () => {
    await runSiheom(
      given.render(<MessageInput {...Stories.Master.args} />),
      assertions.textContent(query.status("마스터 남은 글자 수"), "140"),
      actions.fill(query.textbox("마스터 대화"), "문이 열린다"),
      assertions.textContent(query.status("마스터 남은 글자 수"), "134"),
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
      actions.click(query.combobox("마스터 화자")),
      actions.click(query.option("Player")),
      assertions.not.expanded(query.combobox("마스터 화자")),
      actions.fill(query.textbox("마스터 대화"), "안으로 들어간다"),
      assertions.value(query.textbox("마스터 대화"), "안으로 들어간다"),
      actions.click(query.button("마스터로 남기기")),
      assertions.value(query.textbox("마스터 대화"), ""),
      assertions.textContent(query.combobox("마스터 화자"), "Player"),
    );

    expect(result).toStrictEqual({ side: "master", as: "player", text: "안으로 들어간다" });
  });
});
