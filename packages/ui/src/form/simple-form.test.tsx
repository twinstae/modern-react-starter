import { describe, expect, it } from "vitest";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import * as Stories from "./simple-form.stories.tsx";
import type { NoteValues } from "./simple-form.stories.tsx";

const NoteForm = Stories.default.component;

describe("SimpleForm", () => {
  it("onSubmit이 오류 메시지를 돌려주면 입력을 남긴 채 폼 오류로 보이고, 다음 제출이 성공하면 사라진다", async () => {
    const results = ["저장하지 못했습니다", undefined];
    let submitted = 0;

    await runSiheom(
      given.render(
        <NoteForm {...Stories.SubmitError.args} onSubmit={async () => results[submitted++]} />,
      ),
      actions.fill(query.textbox("제목"), "첫 노트"),
      actions.click(query.button("저장")),
      assertions.visible(query.alert("저장하지 못했습니다")),
      assertions.value(query.textbox("제목"), "첫 노트"),
      actions.click(query.button("저장")),
      assertions.not.visible(query.alert("저장하지 못했습니다")),
    );

    expect(submitted).toBe(2);
  });

  it("resetOnSuccess로 고른 필드만 제출에 성공하면 비워지고, 실패하면 그대로 남는다", async () => {
    let result: NoteValues | undefined;

    await runSiheom(
      given.render(
        <NoteForm
          {...Stories.ResetTitleOnSuccess.args}
          onSubmit={async (values) => {
            result = values;
            return values.memo === "실패" ? "저장하지 못했습니다" : undefined;
          }}
        />,
      ),
      actions.fill(query.textbox("제목"), "첫 노트"),
      actions.fill(query.textbox("메모"), "실패"),
      actions.click(query.button("저장")),
      assertions.value(query.textbox("제목"), "첫 노트"),
      actions.fill(query.textbox("메모"), "성공"),
      actions.click(query.button("저장")),
      assertions.value(query.textbox("제목"), ""),
      assertions.value(query.textbox("메모"), "성공"),
    );

    expect(result).toStrictEqual({ title: "첫 노트", memo: "성공" });
  });

  it("SimpleWatch는 입력하는 필드 값을 그때그때 보여 준다", async () => {
    await runSiheom(
      given.render(<NoteForm {...Stories.WithTitleLength.args} />),
      assertions.textContent(query.status("제목 글자 수"), "0"),
      actions.fill(query.textbox("제목"), "첫 노트"),
      assertions.textContent(query.status("제목 글자 수"), "4"),
    );
  });
});
