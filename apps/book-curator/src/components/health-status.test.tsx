import { describe, it } from "vite-plus/test";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { HealthStatus } from "./health-status.tsx";
import * as Stories from "./health-status.stories.tsx";

describe("HealthStatus", () => {
  it("health 응답의 상태와 확인 시각을 보여 준다", async () => {
    await runSiheom(
      given.render(<HealthStatus {...Stories.Healthy.args} />),
      assertions.textContent(
        query.status("서버 상태"),
        "서버 상태: ok · 확인 2026-10-25T00:00:00.000Z",
      ),
    );
  });
});
