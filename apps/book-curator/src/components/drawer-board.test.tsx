import { describe, it } from "vite-plus/test";
import { assertions, given, query, runSiheom } from "@siheom/react";

import { DrawerBoard } from "./drawer-board.tsx";
import * as Stories from "./drawer-board.stories.tsx";

describe("DrawerBoard", () => {
  it("3종 미만인 서랍마다 경고를 보여 준다", async () => {
    await runSiheom(
      given.render(<DrawerBoard {...Stories.drawerBoardArgs} />),
      assertions.visible(query.status("나를 들여다보는 책 3종 미만 경고")),
    );
  });

  it("수량 0인 책도 목록에 남긴다", async () => {
    await runSiheom(
      given.render(<DrawerBoard {...Stories.drawerBoardArgs} />),
      assertions.visible(query.textbox("나를 들여다보는 책 마음의 지도 수량")),
      assertions.value(query.textbox("나를 들여다보는 책 마음의 지도 수량"), "0"),
    );
  });
});
