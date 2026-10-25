import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { NicknameStart } from "./nickname-start.tsx";
import * as Stories from "./nickname-start.stories.tsx";

describe("NicknameStart", () => {
  it("별명을 넣고 시작하면 앞뒤 공백을 뺀 별명으로 onStart를 부른다", async () => {
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
      actions.fill(query.textbox("별명"), "  토끼  "),
      actions.click(query.button("시작")),
    );

    expect(started).toBe("토끼");
  });

  it("빈 별명으로 시작하면 이유를 보여 주고 시작하지 않는다", async () => {
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
      actions.click(query.button("시작")),
      assertions.errormessage(query.textbox("별명"), "별명을 입력해 주세요"),
    );

    expect(started).toBeUndefined();
  });

  it("너무 긴 별명은 이유를 보여 주고 시작하지 않는다", async () => {
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
      actions.fill(query.textbox("별명"), "가".repeat(11)),
      actions.click(query.button("시작")),
      assertions.errormessage(query.textbox("별명"), "별명은 10자까지 쓸 수 있어요"),
    );

    expect(started).toBeUndefined();
  });

  it("오류가 난 뒤 다시 입력하면 오류를 지운다", async () => {
    await runSiheom(
      given.render(<NicknameStart {...Stories.nicknameStartArgs} />),
      actions.click(query.button("시작")),
      assertions.errormessage(query.textbox("별명"), "별명을 입력해 주세요"),
      actions.type(query.textbox("별명"), "토끼"),
      assertions.not.visible(query.alert("별명을 입력해 주세요")),
    );
  });
});
