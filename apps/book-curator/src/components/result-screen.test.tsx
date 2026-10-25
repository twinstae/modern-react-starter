import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { SHELF_BOOKS } from "../domain/shelf.fixture.ts";
import { ResultScreen } from "./result-screen.tsx";
import * as Stories from "./result-screen.stories.tsx";

const bodyText = (): string => document.body.textContent ?? "";

describe("ResultScreen", () => {
  it("서윤의 두 상태 문장과 추천 서랍, 인용과 권하는 이유를 보여 준다", async () => {
    const args = Stories.resultScreenArgs.seoyun;

    await runSiheom(
      given.render(<ResultScreen {...args} />),
      assertions.visible(query.heading(args.customer.firstStatement)),
      assertions.visible(query.heading("함께 필요한")),
      assertions.visible(query.heading(args.customer.recommendedDrawerName)),
    );

    const text = bodyText();
    expect(args.customer.recommendedDrawerName).toBe("삶의 방식을 바꾸는 책");
    expect(args.customer.secondStatement).toContain("나를 들여다보는 책");
    expect(args.similar).toBe(false);
    expect(args.customer.recommendedMark).not.toBeNull();
    expect(args.customer.recommendedReason).not.toBeNull();
    expect(text).toContain(args.customer.secondStatement);
    expect(text).toContain(args.customer.recommendedMark ?? "");
    expect(text).toContain(args.customer.citation);
    expect(text).toContain(args.customer.recommendedReason ?? "");
    expect(text.match(/토끼 님/g)).toHaveLength(2);
  });

  it("화면 어디에도 서랍 코드, 점수, 순위 숫자, 책 제목이 없다(I-9, C-2)", async () => {
    await runSiheom(given.render(<ResultScreen {...Stories.resultScreenArgs.seoyun} />));

    const text = bodyText();
    expect(text).not.toMatch(/\bB[1-7]\b/);
    expect(text).not.toMatch(/점수|퍼센트|%|1순위|2순위/);
    for (const { title } of SHELF_BOOKS) {
      expect(text).not.toContain(title);
    }
    expect(text).not.toContain("모든 질문에 답했어요");
  });

  it("주인 확인과 다시 해 보기는 각각의 콜백을 부른다", async () => {
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

  it("주인 확인 안내가 있으면 상태로 보여 준다", async () => {
    await runSiheom(
      given.render(
        <ResultScreen
          {...Stories.resultScreenArgs.seoyun}
          ownerCheckNotice="주인 확인은 다음 단계에서 연결됩니다"
        />,
      ),
      assertions.visible(query.status("주인 확인 안내")),
    );

    expect(bodyText()).toContain("주인 확인은 다음 단계에서 연결됩니다");
  });

  it("비슷함이면 부드러운 한 줄을 더하고 순위는 그대로 둔다", async () => {
    const args = Stories.resultScreenArgs.similar;

    await runSiheom(
      given.render(<ResultScreen {...args} />),
      assertions.visible(query.heading(args.customer.recommendedDrawerName)),
    );

    expect(args.similar).toBe(true);
    expect(bodyText()).toContain("두 서랍의 필요가 비슷하게 겹쳐 있어요");
  });

  it("서랍마다 그 서랍이 1순위인 실제 결과를 보여 준다", async () => {
    const args = Stories.resultScreenArgs;

    expect(args.drawerB6.customer.recommendedDrawerName).toBe("삶의 방식을 바꾸는 책");
    expect(args.drawerB1.customer.recommendedDrawerName).toBe("나를 들여다보는 책");
    expect(args.drawerB4.customer.recommendedDrawerName).toBe("사회를 이해하는 책");
    expect(args.drawerB2.customer.recommendedDrawerName).toBe("관계를 다시 생각하는 책");
    expect(args.drawerB7.customer.recommendedDrawerName).toBe("잠시 멈춰 생각하는 책");
    expect(args.drawerB3.customer.recommendedDrawerName).toBe("다른 삶을 만나는 책");
    expect(args.drawerB5.customer.recommendedDrawerName).toBe("세계를 넓혀 보는 책");

    await runSiheom(
      given.render(<ResultScreen {...args.longest} />),
      assertions.visible(query.heading(args.longest.customer.recommendedDrawerName)),
    );
  });
});
