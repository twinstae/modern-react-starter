import { describe, it } from "vite-plus/test";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { StatementPreview } from "./statement-preview.tsx";
import * as Stories from "./statement-preview.stories.tsx";

describe("StatementPreview", () => {
  it("서랍 이름의 받침에 맞는 조사와 예시 별명으로 문장과 인용을 보여 준다", async () => {
    await runSiheom(
      given.render(<StatementPreview {...Stories.statementPreviewArgs} />),
      assertions.a11ySnapshot(query.article("상태 문장 미리보기"), "statement-preview.snap"),
    );
  });
});
