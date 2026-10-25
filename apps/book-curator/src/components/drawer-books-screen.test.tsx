import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { DrawerBooksScreen } from "./drawer-books-screen.tsx";
import * as Stories from "./drawer-books-screen.stories.tsx";

const bodyText = (): string => document.body.textContent ?? "";

describe("DrawerBooksScreen", () => {
  it("건넨 서랍의 책과 수량 0을 보여 주고 다른 서랍 책은 없다(I-9, R-9)", async () => {
    const args = Stories.drawerBooksArgs.threeBooks;

    await runSiheom(
      given.render(<DrawerBooksScreen {...args} />),
      assertions.visible(query.main("서랍 속 책 안내")),
      assertions.visible(query.heading(args.drawer.name)),
      assertions.visible(query.heading("삶을 바꾸는 연습")),
      assertions.visible(query.heading("하루의 구조")),
      assertions.visible(query.heading("작은 실험")),
    );

    expect(args.books).toHaveLength(3);
    expect(args.books.map(({ quantity }) => quantity)).toStrictEqual([2, 0, 1]);

    const text = bodyText();
    expect(text).toContain("열쇠를 받았어요");
    expect(text).toContain(args.drawer.mark ?? "");
    expect(text).toContain("없음");
    expect(text).toContain("이 책을 지금 건네고 싶은 이유");
    expect(text).toContain("이 책을 읽고 함께 생각해 볼 질문");
    expect(text).toContain("산 책 기록");
    expect(text).not.toContain("나를 보는 시간");
    expect(text).not.toContain("관계의 거리");
    expect(text).not.toMatch(/\bB[1-7]\b/);
  });

  it("책마다 기록 버튼이 그 책 id로 onPurchase를 부르고, 처음으로는 onFinish를 부른다", async () => {
    const args = Stories.drawerBooksArgs.threeBooks;
    const purchased: string[] = [];
    let finished = false;

    await runSiheom(
      given.render(
        <DrawerBooksScreen
          {...args}
          onPurchase={(bookId) => {
            purchased.push(bookId);
          }}
          onFinish={() => {
            finished = true;
          }}
        />,
      ),
      actions.click(query.button("삶을 바꾸는 연습 이 책 기록")),
      actions.click(query.button("처음으로")),
      assertions.disabled(query.button("하루의 구조 이 책 기록")),
    );

    expect(purchased).toStrictEqual(["book-b6-1"]);
    expect(finished).toBe(true);
  });

  it("수량 0인 책은 기록할 수 없고, 기록한 책에는 기록했어요를 보여 준다", async () => {
    const args = Stories.drawerBooksArgs.tokenExpired;

    await runSiheom(
      given.render(<DrawerBooksScreen {...args} />),
      assertions.disabled(query.button("삶을 바꾸는 연습 이 책 기록")),
      assertions.visible(query.status("산 책 기록 안내")),
    );

    expect(bodyText()).toContain("기록했어요");
    expect(bodyText()).toContain("주인 확인 시간이 끝나 산 책 기록은 할 수 없어요.");
  });
});
