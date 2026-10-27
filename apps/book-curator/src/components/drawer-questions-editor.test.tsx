import { describe, expect, it } from "vite-plus/test";
import { actions, given, query, runSiheom } from "@siheom/react";

import { DrawerQuestionsEditor } from "./drawer-questions-editor.tsx";

describe("DrawerQuestionsEditor", () => {
  it("한 줄에 하나씩 쓴 문항을 빈 줄 없이 저장한다", async () => {
    const saved: string[][] = [];

    await runSiheom(
      given.render(
        <DrawerQuestionsEditor
          questions={["요즘 생활에서 뭔가를 바꾸고 싶다"]}
          onSave={async (questions) => {
            saved.push(questions);
            return undefined;
          }}
        />,
      ),
      actions.fill(
        query.textbox("문항"),
        "요즘 생활에서 뭔가를 바꾸고 싶다\n\n  읽은 책을 삶에 써 보고 싶다  \n",
      ),
      actions.click(query.button("문항 저장")),
    );

    expect(saved).toStrictEqual([
      ["요즘 생활에서 뭔가를 바꾸고 싶다", "읽은 책을 삶에 써 보고 싶다"],
    ]);
  });
});
