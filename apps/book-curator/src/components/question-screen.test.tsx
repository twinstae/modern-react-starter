import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { QuestionScreen, type ItemScaleValue } from "./question-screen.tsx";
import * as Stories from "./question-screen.stories.tsx";

describe("QuestionScreen", () => {
  it("문항을 그룹 이름으로 보여 주고 척도를 누르면 그 값을 바로 넘긴다", async () => {
    let answered: ItemScaleValue | undefined;
    const args = Stories.questionScreenArgs.first;

    await runSiheom(
      given.render(
        <QuestionScreen
          {...args}
          onAnswer={(value) => {
            answered = value;
          }}
        />,
      ),
      assertions.visible(query.group(args.questionText)),
      actions.click(query.radio("매우 그렇다")),
    );

    expect(answered).toBe(5);
  });

  it("되돌아가기를 누르면 onBack을 부른다", async () => {
    let wentBack = false;

    await runSiheom(
      given.render(
        <QuestionScreen
          {...Stories.questionScreenArgs.last}
          onBack={() => {
            wentBack = true;
          }}
        />,
      ),
      actions.click(query.button("되돌아가기")),
    );

    expect(wentBack).toBe(true);
  });

  it("진행은 문항 수에 맞춰 보여 준다(I-5)", async () => {
    await runSiheom(
      given.render(<QuestionScreen {...Stories.questionScreenArgs.first} index={2} total={3} />),
      assertions.textContent(query.status("진행"), "3 / 3"),
    );
  });
});
