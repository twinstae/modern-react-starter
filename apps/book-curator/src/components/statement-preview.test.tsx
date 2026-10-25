import { describe, it } from "vite-plus/test";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { StatementPreview } from "./statement-preview.tsx";
import * as Stories from "./statement-preview.stories.tsx";

describe("StatementPreview", () => {
  it("받침이 있는 서랍 이름에 맞는 조사와 예시 별명을 보여 준다", async () => {
    await runSiheom(
      given.render(<StatementPreview {...Stories.statementPreviewArgs} />),
      assertions.textContent(
        query.paragraph("첫 상태 문장"),
        "토끼 님에겐 지금, 삶의 방식을 바꾸는 책이 필요해 보여요",
      ),
      assertions.textContent(
        query.paragraph("둘째 상태 문장"),
        "삶의 방식을 바꾸는 책이 함께 보이면 좋겠어요",
      ),
      assertions.textContent(
        query.paragraph("조사 확인"),
        "서랍 이름에 붙는 조사: 삶의 방식을 바꾸는 책이",
      ),
    );
  });

  it("인용 문형에 문항 문장을 넣어 보여 준다", async () => {
    await runSiheom(
      given.render(<StatementPreview {...Stories.statementPreviewArgs} />),
      assertions.textContent(
        query.blockquote("인용 미리보기"),
        "‘요즘 생활에서 뭔가를 바꾸고 싶다’라고 하셨죠",
      ),
    );
  });
});
