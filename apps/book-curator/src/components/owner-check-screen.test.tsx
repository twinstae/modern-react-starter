import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import type { DrawerCode } from "../domain/question-set.ts";
import { OwnerCheckScreen } from "./owner-check-screen.tsx";
import * as Stories from "./owner-check-screen.stories.tsx";

const bodyText = (): string => document.body.textContent ?? "";

describe("OwnerCheckScreen", () => {
  it("주인 모드 머리말과 추천·2순위 서랍, 표시, 상태 문장, 책과 수량을 보여 준다", async () => {
    const args = Stories.ownerCheckArgs.normal;

    await runSiheom(
      given.render(<OwnerCheckScreen {...args} />),
      assertions.visible(query.main("주인 확인")),
      assertions.visible(query.heading(args.view.recommended.name)),
      assertions.visible(query.heading(args.view.second.name)),
    );

    const text = bodyText();
    expect(text).toContain("주인 모드");
    expect(text).toContain("추천 서랍");
    expect(text).toContain("2순위 서랍");
    expect(text).toContain(args.view.recommended.statement);
    expect(text).toContain(args.view.second.statement);
    expect(text).toContain("1번 · 열쇠 1");
    for (const book of args.view.recommended.books) {
      expect(text).toContain(book.title);
    }
    expect(text).toContain("2권");
    expect(text).toContain("없음");
    expect(text).not.toMatch(/\bB[1-7]\b/);
    expect(text).not.toMatch(/점수|1순위|2순위 점수/);
  });

  it("추천 서랍 버튼은 그 서랍 코드로, 다른 서랍 버튼은 그 서랍 코드로 onHandover를 부른다", async () => {
    const args = Stories.ownerCheckArgs.normal;
    const handed: DrawerCode[] = [];

    await runSiheom(
      given.render(
        <OwnerCheckScreen
          {...args}
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

  it("3종 미만 경고와 비슷함을 보여 준다(I-7)", async () => {
    const below = Stories.ownerCheckArgs.belowMinimum;
    const similar = Stories.ownerCheckArgs.similar;

    await runSiheom(
      given.render(<OwnerCheckScreen {...below} />),
      assertions.visible(query.status("서가 게이트")),
    );
    expect(similar.view.similar).toBe(true);
    expect(bodyText()).toContain("3종이 안 돼요");
    expect(bodyText()).toContain("지금 2종이에요");

    await runSiheom(given.render(<OwnerCheckScreen {...similar} />));
    expect(bodyText()).toContain("두 서랍이 비슷하게 보여요. 손님과 함께 골라도 좋아요.");
  });

  it("손님 화면으로 돌아가는 버튼이 onCancel을 부른다", async () => {
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
