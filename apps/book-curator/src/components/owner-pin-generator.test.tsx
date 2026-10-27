import { describe, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { OwnerPinGenerator } from "./owner-pin-generator.tsx";
import * as Stories from "./owner-pin-generator.stories.tsx";

describe("OwnerPinGenerator", () => {
  it("새 PIN을 만들면 그 PIN을 한 번 보여 준다", async () => {
    await runSiheom(
      given.render(<OwnerPinGenerator {...Stories.ownerPinGeneratorArgs} />),
      actions.click(query.button("새 PIN 만들기")),
      assertions.textContent(query.heading("새 주인 PIN"), "048213"),
    );
  });
});
