import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { DrawerQuestionsEditor } from "./drawer-questions-editor.tsx";
import * as Stories from "./drawer-questions-editor.stories.tsx";

describe("DrawerQuestionsEditor", () => {
  it("문항을 하나씩 더하고 빼서 저장하면 그 순서대로 남는다", async () => {
    const saved: string[][] = [];

    await runSiheom(
      given.render(
        <DrawerQuestionsEditor
          {...Stories.drawerQuestionsEditorArgs}
          onSave={async (questions) => {
            saved.push(questions);
            return undefined;
          }}
        />,
      ),
      assertions.disabled(query.button("문항 저장")),
      actions.click(query.button("문항 더하기")),
      actions.fill(query.textbox("문항 3"), "  요즘 일하는 방식을 바꾸고 싶다  "),
      actions.click(query.button("문항 1 빼기")),
      actions.click(query.button("문항 저장")),
      assertions.disabled(query.button("문항 저장")),
    );

    expect(saved).toStrictEqual([
      ["읽은 책을 삶에 써 보고 싶다", "요즘 일하는 방식을 바꾸고 싶다"],
    ]);
  });
});

describe("DrawerQuestionsEditor 되돌리기", () => {
  it("고친 문항을 되돌리면 저장한 문항으로 돌아가고 저장할 것이 없다", async () => {
    await runSiheom(
      given.render(<DrawerQuestionsEditor {...Stories.drawerQuestionsEditorArgs} />),
      actions.click(query.button("문항 1 빼기")),
      actions.click(query.button("되돌리기")),
      assertions.value(query.textbox("문항 1"), "요즘 생활에서 뭔가를 바꾸고 싶다"),
      assertions.disabled(query.button("문항 저장")),
    );
  });
});
