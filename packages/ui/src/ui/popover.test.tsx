import { screen, waitFor } from "@testing-library/dom";
import { describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import * as Stories from "./popover.stories.tsx";

const PopoverExample = Stories.default.component;

// siheom 0.3.0은 요소가 없음을 확인하지 못해서, 닫힘은 waitFor와 queryByRole로 직접 확인한다
const waitClosed = () =>
  waitFor(() => expect(screen.queryByRole("dialog", { name: "팝오버 제목" })).toBeNull());

describe("Popover", () => {
  it("트리거를 누르면 제목을 이름으로 가진 대화 상자가 열리고 초점이 안으로 들어간다", async () => {
    await runSiheom(
      given.render(<PopoverExample {...Stories.Default.args} />),
      actions.click(query.button("팝오버 열기")),
      assertions.visible(query.dialog("팝오버 제목")),
      assertions.expanded(query.button("팝오버 열기")),
    );

    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "팝오버 제목" })).toContainElement(
        document.activeElement as HTMLElement,
      ),
    );
  });

  it("Esc를 누르면 닫히고 초점이 트리거로 돌아온다", async () => {
    await runSiheom(
      given.render(<PopoverExample {...Stories.Default.args} />),
      actions.click(query.button("팝오버 열기")),
      assertions.visible(query.dialog("팝오버 제목")),
      actions.type(query.button("안의 버튼"), "{Escape}"),
    );

    await waitClosed();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "팝오버 열기" }));
  });

  it("바깥을 누르면 닫힌다", async () => {
    await runSiheom(
      given.render(<PopoverExample {...Stories.Default.args} />),
      actions.click(query.button("팝오버 열기")),
      assertions.visible(query.dialog("팝오버 제목")),
    );
    // siheom의 click(@testing-library/user-event의 합성 이벤트)은 Ark의 바깥 상호작용 감지에 닿지 않는다.
    // 실제 사용자처럼 Playwright로 누른다.
    await userEvent.click(screen.getByRole("button", { name: "바깥 버튼" }));

    await waitClosed();
  });

  it("닫기 버튼을 누르면 닫힌다", async () => {
    await runSiheom(
      given.render(<PopoverExample {...Stories.Default.args} />),
      actions.click(query.button("팝오버 열기")),
      actions.click(query.button("닫기")),
    );

    await waitClosed();
  });
});
