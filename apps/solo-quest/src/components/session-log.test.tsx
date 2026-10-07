import { describe, it } from "vitest";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { SessionLog } from "./session-log.tsx";
import * as Stories from "./session-log.stories.tsx";

describe("SessionLog", () => {
  it("기록이 없으면 안내를 보여 준다", async () => {
    await runSiheom(
      given.render(<SessionLog {...Stories.Empty.args} />),
      assertions.textContent(query.region("세션 로그"), "아직 기록이 없습니다"),
    );
  });
});
