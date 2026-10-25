import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { PinEntry } from "./pin-entry.tsx";
import * as Stories from "./pin-entry.stories.tsx";

describe("PinEntry", () => {
  it("4~6자리 PIN을 onSubmit에 넘긴다", async () => {
    let submitted: string | undefined;

    await runSiheom(
      given.render(
        <PinEntry
          {...Stories.pinEntryArgs}
          onSubmit={async (pin) => {
            submitted = pin;
            return undefined;
          }}
        />,
      ),
      actions.fill(query.label("주인 PIN"), "4821"),
      actions.click(query.button("열기")),
    );

    expect(submitted).toBe("4821");
  });

  it("너무 짧은 PIN은 이유를 보여 주고 보내지 않는다", async () => {
    let submitted: string | undefined;

    await runSiheom(
      given.render(
        <PinEntry
          {...Stories.pinEntryArgs}
          onSubmit={async (pin) => {
            submitted = pin;
            return undefined;
          }}
        />,
      ),
      actions.fill(query.label("주인 PIN"), "12"),
      actions.click(query.button("열기")),
      assertions.errormessage(query.label("주인 PIN"), "PIN은 4~6자리로 입력해 주세요"),
    );

    expect(submitted).toBeUndefined();
  });

  it("숫자가 아닌 PIN은 이유를 보여 주고 보내지 않는다", async () => {
    let submitted: string | undefined;

    await runSiheom(
      given.render(
        <PinEntry
          {...Stories.pinEntryArgs}
          onSubmit={async (pin) => {
            submitted = pin;
            return undefined;
          }}
        />,
      ),
      actions.fill(query.label("주인 PIN"), "12ab"),
      actions.click(query.button("열기")),
      assertions.errormessage(query.label("주인 PIN"), "PIN은 숫자로 입력해 주세요"),
    );

    expect(submitted).toBeUndefined();
  });

  it("콜백이 돌려준 실패 문구를 보여 준다", async () => {
    await runSiheom(
      given.render(
        <PinEntry {...Stories.pinEntryArgs} onSubmit={async () => "PIN이 맞지 않아요"} />,
      ),
      actions.fill(query.label("주인 PIN"), "0000"),
      actions.click(query.button("열기")),
      assertions.errormessage(query.label("주인 PIN"), "PIN이 맞지 않아요"),
    );
  });
});
