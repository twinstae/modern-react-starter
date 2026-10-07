import { describe, it } from "vitest";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { MemoryRouter } from "./memory-router.tsx";
import { SessionList } from "./session-list.tsx";
import * as Stories from "./session-list.stories.tsx";

describe("SessionList", () => {
  it("세션이 없으면 안내를 보여 준다", async () => {
    await runSiheom(
      given.render(
        <MemoryRouter>
          <SessionList {...Stories.Empty.args} />
        </MemoryRouter>,
      ),
      assertions.textContent(query.region("세션 목록"), "아직 세션이 없습니다"),
    );
  });

  it("각 세션의 제목이 그 세션 화면으로 가는 링크다", async () => {
    await runSiheom(
      given.render(
        <MemoryRouter>
          <SessionList {...Stories.One.args} />
        </MemoryRouter>,
      ),
      assertions.href(query.link("첫 모험"), "/sessions/session-1"),
    );
  });
});
