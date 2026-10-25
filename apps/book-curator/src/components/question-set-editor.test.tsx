import { describe, expect, it } from "vite-plus/test";
import { actions, given, query, runSiheom } from "@siheom/react";

import type { QuestionSet } from "../domain/question-set.ts";
import { QuestionSetEditor } from "./question-set-editor.tsx";
import * as Stories from "./question-set-editor.stories.tsx";

const itemCount = (set: QuestionSet, drawer: string): number =>
  set.questions.filter((question) => question.type === "item" && question.drawer === drawer).length;

describe("QuestionSetEditor", () => {
  it("문항을 더하고 빼면 서랍별 문항 수가 바뀐 질문 세트를 저장한다", async () => {
    let saved: { name: string; questionSet: QuestionSet } | undefined;

    await runSiheom(
      given.render(
        <QuestionSetEditor
          {...Stories.questionSetEditorArgs}
          onSave={async (input) => {
            saved = input;
            return undefined;
          }}
        />,
      ),
      actions.click(query.button("사회를 이해하는 책 문항 추가")),
      actions.click(query.button("삶의 방식을 바꾸는 책 1번 문항 빼기")),
      actions.click(query.button("초안 저장")),
    );

    expect(saved?.name).toBe("11월 질문 세트");
    expect(saved?.questionSet.questions).toHaveLength(14);
    expect(itemCount(saved?.questionSet as QuestionSet, "B4")).toBe(3);
    expect(itemCount(saved?.questionSet as QuestionSet, "B6")).toBe(1);
    expect(saved?.questionSet.baselines).toStrictEqual([]);
  });
});
