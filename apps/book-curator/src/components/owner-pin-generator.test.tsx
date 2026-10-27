import { describe, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { OwnerPinGenerator } from "./owner-pin-generator.tsx";

describe("OwnerPinGenerator", () => {
  it("새 PIN을 만들면 그 PIN을 한 번 보여 준다", async () => {
    await runSiheom(
      given.render(<OwnerPinGenerator onGenerate={async () => ({ pin: "048213" })} />),
      actions.click(query.button("새 PIN 만들기")),
      assertions.textContent(query.heading("새 주인 PIN"), "048213"),
    );
  });
});
