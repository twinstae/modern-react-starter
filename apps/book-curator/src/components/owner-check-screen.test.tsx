import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { OwnerCheckScreen } from "./owner-check-screen.tsx";
import * as Stories from "./owner-check-screen.stories.tsx";

describe("OwnerCheckScreen", () => {
  it("주인에게 추천 서랍과 2순위 서랍, 그 서랍의 책과 수량을 보여 준다", async () => {
    await runSiheom(
      given.render(<OwnerCheckScreen {...Stories.ownerCheckArgs.normal} />),
      assertions.visible(query.heading("삶의 방식을 바꾸는 책")),
      assertions.visible(query.heading("나를 들여다보는 책")),
      assertions.a11ySnapshot(query.main("주인 확인"), "owner-check-screen.normal.snap"),
    );
  });

  it("추천 서랍과 다른 서랍의 열쇠 건넴을 누르면 그 서랍을 건넨 것으로 남긴다", async () => {
    const handed: string[] = [];

    await runSiheom(
      given.render(
        <OwnerCheckScreen
          {...Stories.ownerCheckArgs.normal}
          onHandover={(drawer) => {
            handed.push(drawer);
          }}
        />,
      ),
      actions.click(query.button("이 서랍 열쇠 건넴")),
      actions.click(query.button("나를 들여다보는 책 열쇠 건넴")),
      actions.click(query.button("관계를 다시 생각하는 책 열쇠 건넴")),
    );

    expect(handed).toStrictEqual(["B6", "B1", "B2"]);
  });

  it("책이 모자란 서랍은 열쇠를 건네기 전에 알려 준다", async () => {
    await runSiheom(
      given.render(<OwnerCheckScreen {...Stories.ownerCheckArgs.belowMinimum} />),
      assertions.visible(query.status("삶의 방식을 바꾸는 책 3종 미만 경고")),
      assertions.a11ySnapshot(query.main("주인 확인"), "owner-check-screen.below-minimum.snap"),
    );
  });

  it("두 서랍이 비슷하면 주인에게 함께 골라도 좋다고 알려 준다", async () => {
    await runSiheom(
      given.render(<OwnerCheckScreen {...Stories.ownerCheckArgs.similar} />),
      assertions.a11ySnapshot(query.main("주인 확인"), "owner-check-screen.similar.snap"),
    );
  });

  it("손님 화면으로 돌아가면 주인 확인을 닫는다", async () => {
    let cancelled = false;

    await runSiheom(
      given.render(
        <OwnerCheckScreen
          {...Stories.ownerCheckArgs.normal}
          onCancel={() => {
            cancelled = true;
          }}
        />,
      ),
      actions.click(query.button("손님 화면으로")),
    );

    expect(cancelled).toBe(true);
  });
});
