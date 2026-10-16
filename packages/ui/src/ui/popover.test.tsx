import { describe, it } from "vitest";
import { userEvent } from "vitest/browser";
import { actions, assertions, createReactSiheom, given, query } from "@siheom/react";

import * as Stories from "./popover.stories.tsx";

const PopoverExample = Stories.default.component;

// Ark UI 팝오버는 바깥 상호작용 감지에 진짜 입력이 필요하다. vitest/browser의 userEvent를 넘겨
// 실제 입력으로 돌린다.
const { runSiheom } = createReactSiheom({ user: userEvent });

describe("Popover", () => {
  it("트리거를 누르면 제목을 이름으로 가진 대화 상자가 열리고 초점이 안의 첫 버튼으로 간다", async () => {
    await runSiheom(
      given.render(<PopoverExample {...Stories.Default.args} />),
      actions.click(query.button("팝오버 열기")),
      assertions.visible(query.dialog("팝오버 제목")),
      assertions.expanded(query.button("팝오버 열기")),
      assertions.focused(query.button("안의 버튼")),
    );
  });

  it("Esc를 누르면 닫히고 초점이 트리거로 돌아온다", async () => {
    await runSiheom(
      given.render(<PopoverExample {...Stories.Default.args} />),
      actions.click(query.button("팝오버 열기")),
      assertions.visible(query.dialog("팝오버 제목")),
      actions.type(query.button("안의 버튼"), "{Escape}"),
      assertions.focused(query.button("팝오버 열기")),
      assertions.not.visible(query.dialog("팝오버 제목")),
    );
  });

  it("바깥을 누르면 닫힌다", async () => {
    await runSiheom(
      given.render(<PopoverExample {...Stories.Default.args} />),
      actions.click(query.button("팝오버 열기")),
      assertions.visible(query.dialog("팝오버 제목")),
      actions.click(query.button("바깥 버튼")),
      assertions.not.visible(query.dialog("팝오버 제목")),
    );
  });

  it("닫기 버튼을 누르면 닫힌다", async () => {
    await runSiheom(
      given.render(<PopoverExample {...Stories.Default.args} />),
      actions.click(query.button("팝오버 열기")),
      actions.click(query.button("닫기")),
      assertions.not.visible(query.dialog("팝오버 제목")),
    );
  });
});
