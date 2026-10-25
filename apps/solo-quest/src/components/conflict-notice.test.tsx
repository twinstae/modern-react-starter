import { describe, it } from "vite-plus/test";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { ConflictNotice } from "./conflict-notice.tsx";
import * as Stories from "./conflict-notice.stories.tsx";

describe("ConflictNotice", () => {
  it("알림이 있으면 경고로 보인다", async () => {
    await runSiheom(
      given.render(<ConflictNotice {...Stories.Conflicted.args} />),
      assertions.visible(
        query.alert("다른 곳에서 먼저 기록했습니다. 최신 기록을 다시 불러왔습니다"),
      ),
    );
  });

  it("알림이 없으면 아무것도 보이지 않는다", async () => {
    await runSiheom(
      given.render(<ConflictNotice {...Stories.None.args} />),
      assertions.not.visible(
        query.alert("다른 곳에서 먼저 기록했습니다. 최신 기록을 다시 불러왔습니다"),
      ),
    );
  });
});
