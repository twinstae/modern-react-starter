import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import type { BookInput } from "../domain/book.ts";
import { BookForm } from "./book-form.tsx";
import * as Stories from "./book-form.stories.tsx";

describe("BookForm", () => {
  it("부록 C 항목을 관련도 일곱 칸과 함께 onSubmit에 넘긴다", async () => {
    let submitted: BookInput | undefined;

    await runSiheom(
      given.render(
        <BookForm
          {...Stories.bookFormArgs}
          onSubmit={async (input) => {
            submitted = input;
            return undefined;
          }}
        />,
      ),
      actions.fill(query.label("제목"), "계급을 읽는 법"),
      actions.fill(query.label("저자"), "박계급"),
      actions.fill(query.label("핵심 단어"), "계급, 불평등"),
      actions.fill(query.label("권하는 이유"), "지금의 구조를 함께 보고 싶을 때"),
      actions.fill(query.label("함께 생각해 볼 질문"), "내가 당연하게 여긴 것은 무엇인가요?"),
      actions.fill(query.label("사회를 이해하는 책 관련도"), "5"),
      actions.fill(query.label("삶의 방식을 바꾸는 책 관련도"), "2"),
      actions.click(query.button("책 저장")),
    );

    expect(submitted).toStrictEqual({
      title: "계급을 읽는 법",
      author: "박계급",
      keywords: ["계급", "불평등"],
      reason: "지금의 구조를 함께 보고 싶을 때",
      question: "내가 당연하게 여긴 것은 무엇인가요?",
      relevance: { B1: 0, B2: 0, B3: 0, B4: 5, B5: 0, B6: 2, B7: 0 },
    });
  });

  it("0~5 정수가 아닌 관련도는 이유를 보여 주고 보내지 않는다", async () => {
    let submitted: BookInput | undefined;

    await runSiheom(
      given.render(
        <BookForm
          {...Stories.bookFormArgs}
          onSubmit={async (input) => {
            submitted = input;
            return undefined;
          }}
        />,
      ),
      actions.fill(query.label("제목"), "계급을 읽는 법"),
      actions.fill(query.label("저자"), "박계급"),
      actions.fill(query.label("핵심 단어"), "계급"),
      actions.fill(query.label("권하는 이유"), "지금의 구조를 함께 보고 싶을 때"),
      actions.fill(query.label("함께 생각해 볼 질문"), "내가 당연하게 여긴 것은 무엇인가요?"),
      actions.fill(query.label("사회를 이해하는 책 관련도"), "6"),
      actions.click(query.button("책 저장")),
      assertions.errormessage(
        query.label("사회를 이해하는 책 관련도"),
        "사회를 이해하는 책 관련도는 0~5 정수로 넣어 주세요",
      ),
    );

    expect(submitted).toBeUndefined();
  });
});
