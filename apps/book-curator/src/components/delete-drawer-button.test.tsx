import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { DeleteDrawerButton } from "./delete-drawer-button.tsx";
import * as Stories from "./delete-drawer-button.stories.tsx";

describe("DeleteDrawerButton", () => {
  it("지우기 전에 책도 함께 지워진다고 경고하고, 그만두면 지우지 않는다", async () => {
    let deleted = 0;

    await runSiheom(
      given.render(
        <DeleteDrawerButton
          {...Stories.deleteDrawerButtonArgs}
          onDelete={() => {
            deleted += 1;
          }}
        />,
      ),
      actions.click(query.button("서랍 지우기")),
      assertions.a11ySnapshot(
        query.alertdialog("“삶의 방식을 바꾸는 책” 서랍을 지울까요?"),
        "delete-drawer-button.confirm.snap",
      ),
      actions.click(query.button("그만두기")),
      actions.click(query.button("서랍 지우기")),
      actions.click(query.button("지우기")),
    );

    expect(deleted).toBe(1);
  });
});
