import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { NewSessionForm, type NewSessionValues } from "./new-session-form.tsx";

describe("NewSessionForm", () => {
  it("제목을 넣고 만들면 앞뒤 공백을 뺀 제목이 제출된다", async () => {
    let result: NewSessionValues | undefined;

    await runSiheom(
      given.render(
        <NewSessionForm
          onSubmit={async (values) => {
            result = values;
          }}
        />,
      ),
      actions.fill(query.textbox("제목"), "  첫 모험 "),
      actions.click(query.button("새 세션")),
    );

    expect(result).toStrictEqual({ title: "첫 모험" });
  });

  it.each([
    ["공백만 있는 제목", "   ", "내용을 입력해주세요"],
    ["141자 제목", "가".repeat(141), "140자 이하로 입력해주세요"],
  ])("%s은 제출되지 않고 오류를 보여 준다", async (_name, title, message) => {
    let result: NewSessionValues | undefined;

    await runSiheom(
      given.render(
        <NewSessionForm
          onSubmit={async (values) => {
            result = values;
          }}
        />,
      ),
      actions.fill(query.textbox("제목"), title),
      actions.click(query.button("새 세션")),
      assertions.errormessage(query.textbox("제목"), message),
    );

    expect(result).toBeUndefined();
  });
});
