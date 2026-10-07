import { describe, it } from "vitest";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { ServerStatus } from "./server-status.tsx";
import * as Stories from "./server-status.stories.tsx";

describe("ServerStatus", () => {
  it.each([
    [Stories.Checking.args, "확인 중"],
    [Stories.Ok.args, "정상"],
    [Stories.Unreachable.args, "연결 안 됨"],
  ])("서버 상태를 글로 알려 준다 (%o → %s)", async (args, text) => {
    await runSiheom(
      given.render(<ServerStatus {...args} />),
      assertions.textContent(query.status("서버 상태"), text),
    );
  });
});
