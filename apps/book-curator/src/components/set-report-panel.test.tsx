import { describe, it } from "vite-plus/test";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { SetReportPanel } from "./set-report-panel.tsx";
import * as Stories from "./set-report-panel.stories.tsx";

describe("SetReportPanel", () => {
  it("쏠림·문항 수 경고·기준 응답 불일치를 보이고 공개 버튼을 막는다", async () => {
    await runSiheom(
      given.render(
        <SetReportPanel {...Stories.setReportPanelArgs} report={Stories.blockedReport} />,
      ),
      assertions.visible(query.listitem(/점검 실패: 표본의 1순위가 10~18%를 벗어난 서랍/)),
      assertions.visible(query.listitem(/점검 경고: 문항 수가 다른 서랍/)),
      assertions.visible(query.listitem(/기준 응답 서윤 불일치/)),
      assertions.visible(query.listitem(/공개 막힘: 서가 게이트/)),
      assertions.disabled(query.button("새 버전으로 공개")),
    );
  });
});
