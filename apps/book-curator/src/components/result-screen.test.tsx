import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { ResultScreen } from "./result-screen.tsx";
import * as Stories from "./result-screen.stories.tsx";

describe("ResultScreen", () => {
  it("손님에게 지금 필요한 서랍 두 개와 추천 서랍을 보여 준다", async () => {
    await runSiheom(
      given.render(<ResultScreen {...Stories.resultScreenArgs.seoyun} />),
      assertions.visible(query.heading("토끼 님은 지금, 바꾸고 싶은 마음이 먼저 움직이고 있어요.")),
      assertions.a11ySnapshot(query.main("결과"), "result-screen.seoyun.snap"),
    );
  });

  it("주인 확인을 누르면 주인 확인을 열고, 다시 해 보기를 누르면 처음으로 돌아간다", async () => {
    let ownerChecked = false;
    let retaken = false;

    await runSiheom(
      given.render(
        <ResultScreen
          {...Stories.resultScreenArgs.seoyun}
          onOwnerCheck={() => {
            ownerChecked = true;
          }}
          onRetake={() => {
            retaken = true;
          }}
        />,
      ),
      actions.click(query.button("주인 확인")),
      actions.click(query.button("다시 해 보기")),
    );

    expect(ownerChecked).toBe(true);
    expect(retaken).toBe(true);
  });

  it("주인 확인이 아직 연결되지 않았으면 그 안내를 보여 준다", async () => {
    await runSiheom(
      given.render(
        <ResultScreen
          {...Stories.resultScreenArgs.seoyun}
          ownerCheckNotice="주인 확인은 다음 단계에서 연결됩니다"
        />,
      ),
      assertions.textContent(
        query.status("주인 확인 안내"),
        "주인 확인은 다음 단계에서 연결됩니다",
      ),
    );
  });

  it("두 서랍이 비슷하면 손님과 함께 골라도 좋다고 알려 준다", async () => {
    await runSiheom(
      given.render(<ResultScreen {...Stories.resultScreenArgs.similar} />),
      assertions.a11ySnapshot(query.main("결과"), "result-screen.similar.snap"),
    );
  });
});
