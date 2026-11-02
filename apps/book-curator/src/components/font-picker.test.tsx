import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import type { FontId } from "../lib/font-preference.ts";
import { FontPicker } from "./font-picker.tsx";

describe("FontPicker", () => {
  it("고른 글꼴을 알린다", async () => {
    let picked: FontId | undefined;

    await runSiheom(
      given.render(
        <FontPicker
          value="kimyui"
          onChange={(id) => {
            picked = id;
          }}
        />,
      ),
      actions.click(query.radio("미생체")),
    );

    expect(picked).toBe("microorganism");
  });

  it("지금 글꼴을 선택된 상태로 보여 준다", async () => {
    await runSiheom(
      given.render(<FontPicker value="noto" onChange={() => {}} />),
      assertions.checked(query.radio("Noto Sans KR")),
    );
  });
});
