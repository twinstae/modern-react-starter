import { describe, expect, it } from "vite-plus/test";
import { actions, given, query, runSiheom } from "@siheom/react";

import { QuestionSetDraftBar } from "./question-set-draft-bar.tsx";
import * as Stories from "./question-set-draft-bar.stories.tsx";

describe("QuestionSetDraftBar", () => {
  it("새 초안 이름을 넣고 초안 만들기를 누르면 그 이름으로 초안을 만든다", async () => {
    let created: string | undefined;

    await runSiheom(
      given.render(
        <QuestionSetDraftBar
          {...Stories.questionSetDraftBarArgs}
          onCreate={(name) => {
            created = name;
          }}
        />,
      ),
      actions.fill(query.textbox("새 초안 이름"), " 12월 질문 세트 "),
      actions.click(query.button("초안 만들기")),
    );

    expect(created).toBe("12월 질문 세트");
  });
});
