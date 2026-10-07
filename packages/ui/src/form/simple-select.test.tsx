import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import * as Stories from "./simple-select.stories.tsx";
import type { SpeakerValues } from "./simple-select.stories.tsx";

const SpeakerForm = Stories.default.component;

describe("SimpleSelect", () => {
  it("항목을 골라 제출하면 고른 항목의 값이 onSubmit으로 넘어간다", async () => {
    let result: SpeakerValues | undefined;

    await runSiheom(
      given.render(
        <SpeakerForm
          {...Stories.Default.args}
          onSubmit={async (values) => {
            result = values;
          }}
        />,
      ),
      actions.click(query.combobox("화자")),
      actions.click(query.option("Player")),
      assertions.textContent(query.combobox("화자"), "Player"),
      actions.click(query.button("저장")),
    );

    expect(result).toStrictEqual({ speaker: "player" });
  });

  it("기본값이 골라져 있고, 다른 항목으로 바꿔 제출할 수 있다", async () => {
    let result: SpeakerValues | undefined;

    await runSiheom(
      given.render(
        <SpeakerForm
          {...Stories.WithValue.args}
          onSubmit={async (values) => {
            result = values;
          }}
        />,
      ),
      assertions.textContent(query.combobox("화자"), "Player"),
      actions.click(query.combobox("화자")),
      actions.click(query.option("상인")),
      actions.click(query.button("저장")),
    );

    expect(result).toStrictEqual({ speaker: "merchant" });
  });

  it("고르지 않고 제출하면 제출되지 않고 오류가 필드에 연결되어 보인다", async () => {
    let result: SpeakerValues | undefined;

    await runSiheom(
      given.render(
        <SpeakerForm
          {...Stories.Default.args}
          onSubmit={async (values) => {
            result = values;
          }}
        />,
      ),
      actions.click(query.button("저장")),
      assertions.errormessage(query.combobox("화자"), "화자를 골라주세요"),
    );

    expect(result).toBeUndefined();
  });

  it("힌트가 설명으로 연결되고, 오류가 나면 오류가 힌트를 대신한다", async () => {
    await runSiheom(
      given.render(<SpeakerForm {...Stories.WithHint.args} />),
      assertions.description(query.combobox("화자"), "말하는 캐릭터를 고릅니다."),
      actions.click(query.button("저장")),
      assertions.description(query.combobox("화자"), "화자를 골라주세요"),
    );
  });
});
