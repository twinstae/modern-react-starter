import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { PublishPanel } from "./publish-panel.tsx";

const NAMES = new Map([
  ["a", "삶의 방식을 바꾸는 책"],
  ["b", "나를 들여다보는 책"],
]);

describe("PublishPanel", () => {
  it("문항 없는 서랍이 있으면 그 서랍 이름을 알리고 공개할 수 없다", async () => {
    await runSiheom(
      given.render(
        <PublishPanel
          check={{
            canPublish: false,
            failures: [{ code: "empty-drawer", drawers: ["b"] }],
            warnings: [],
          }}
          drawerNames={NAMES}
          currentVersion={null}
          onPublish={() => {}}
        />,
      ),
      assertions.disabled(query.button("지금 서랍으로 공개")),
      assertions.a11ySnapshot(query.article("손님 화면에 공개"), "publish-panel.blocked.snap"),
    );
  });

  it("경고만 있으면 공개할 수 있다", async () => {
    let published = 0;

    await runSiheom(
      given.render(
        <PublishPanel
          check={{
            canPublish: true,
            failures: [],
            warnings: [{ code: "few-books", drawers: ["a"] }],
          }}
          drawerNames={NAMES}
          currentVersion={2}
          onPublish={() => {
            published += 1;
          }}
        />,
      ),
      assertions.a11ySnapshot(query.article("손님 화면에 공개"), "publish-panel.warning.snap"),
      actions.click(query.button("지금 서랍으로 공개")),
    );

    expect(published).toBe(1);
  });
});
