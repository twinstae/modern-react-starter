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
      assertions.errormessage(query.textbox("마스터 대화"), "다른 곳에서 먼저 기록했습니다"),
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

  it("빈 입력과 공백만 있는 입력은 제출할 수 없다", async () => {
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
      assertions.disabled(query.button("마스터로 남기기")),
      actions.fill(query.textbox("마스터 대화"), "   "),
      actions.click(query.button("마스터로 남기기")),
    );

    expect(result).toBeUndefined();
  });

  it("140자를 넘으면 제출할 수 없고 남은 글자 수가 음수로 보인다", async () => {
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
      assertions.disabled(query.button("마스터로 남기기")),
      actions.click(query.button("마스터로 남기기")),
    );

    expect(result).toBeUndefined();
  });

  it("화자 목록에서 기본 화자가 골라져 있고 다른 캐릭터를 고르면 onSpeakerChange로 그 id가 넘어간다", async () => {
    let chosen: string | undefined;

    await runSiheom(
      given.render(
        <MessageInput
          {...Stories.Master.args}
          onSpeakerChange={(characterId) => {
            chosen = characterId;
          }}
        />,
      ),
      assertions.checked(query.radio("GM")),
      actions.click(query.radio("Player")),
    );

    expect(chosen).toBe("player");
  });
});
