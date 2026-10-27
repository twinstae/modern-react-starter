import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { PinEntry } from "./pin-entry.tsx";
import * as Stories from "./pin-entry.stories.tsx";

describe("PinEntry", () => {
  it("PIN을 넣으면 주인 확인을 연다", async () => {
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

  it("PIN이 맞지 않으면 그 이유를 보여 준다", async () => {
    await runSiheom(
      given.render(
        <PinEntry {...Stories.pinEntryArgs} onSubmit={async () => "PIN이 맞지 않아요"} />,
      ),
      actions.fill(query.label("주인 PIN"), "0000"),
      actions.click(query.button("열기")),
      assertions.visible(query.alert("PIN이 맞지 않아요")),
    );
  });
});
