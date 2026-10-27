import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { NicknameStart } from "./nickname-start.tsx";
import * as Stories from "./nickname-start.stories.tsx";

describe("NicknameStart", () => {
  it("별명을 넣고 시작하면 앞뒤 공백을 뺀 별명으로 차례를 연다", async () => {
    let started: string | undefined;

    await runSiheom(
      given.render(
        <NicknameStart
          {...Stories.nicknameStartArgs}
          onStart={(nickname) => {
            started = nickname;
          }}
        />,
      ),
      actions.fill(query.textbox("어떻게 불러 드릴까요?"), "  토끼  "),
      actions.click(query.button("시작하기")),
    );

    expect(started).toBe("토끼");
  });

  it("별명 없이 시작하면 이유를 보여 주고 차례를 열지 않는다", async () => {
    let started: string | undefined;

    await runSiheom(
      given.render(
        <NicknameStart
          {...Stories.nicknameStartArgs}
          onStart={(nickname) => {
            started = nickname;
          }}
        />,
      ),
      actions.click(query.button("시작하기")),
      assertions.errormessage(query.textbox("어떻게 불러 드릴까요?"), "별명을 적어 주세요"),
    );

    expect(started).toBeUndefined();
  });
});
