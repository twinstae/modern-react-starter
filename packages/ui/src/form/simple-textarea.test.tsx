import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import * as Stories from "./simple-textarea.stories.tsx";
import type { MemoValues } from "./simple-textarea.stories.tsx";

const MemoForm = Stories.default.component;

describe("SimpleTextarea", () => {
  it("여러 줄을 입력하고 제출하면 줄바꿈이 있는 값이 onSubmit으로 넘어간다", async () => {
    let result: MemoValues | undefined;

    await runSiheom(
      given.render(
        <MemoForm
          {...Stories.Default.args}
          onSubmit={async (values) => {
            result = values;
          }}
        />,
      ),
      actions.fill(query.textbox("메모"), "문이 열린다\n안은 어둡다"),
      actions.click(query.button("저장")),
    );

    expect(result).toStrictEqual({ memo: "문이 열린다\n안은 어둡다" });
  });

  it("검증에 실패하면 제출되지 않고 오류가 필드에 연결되어 보인다", async () => {
    let result: MemoValues | undefined;

    await runSiheom(
      given.render(
        <MemoForm
          {...Stories.Default.args}
          onSubmit={async (values) => {
            result = values;
          }}
        />,
      ),
      actions.click(query.button("저장")),
      assertions.errormessage(query.textbox("메모"), "메모를 입력해주세요"),
    );

    expect(result).toBeUndefined();
  });

  it("힌트가 보이고, 오류가 나면 오류가 힌트를 대신한다", async () => {
    await runSiheom(
      given.render(<MemoForm {...Stories.WithHint.args} />),
      assertions.description(query.textbox("메모"), "줄바꿈을 쓸 수 있습니다."),
      actions.click(query.button("저장")),
      assertions.description(query.textbox("메모"), "메모를 입력해주세요"),
      assertions.errormessage(query.textbox("메모"), "메모를 입력해주세요"),
    );
  });
});
