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
});
