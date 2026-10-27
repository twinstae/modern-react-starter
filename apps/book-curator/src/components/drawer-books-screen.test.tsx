import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { DrawerBooksScreen } from "./drawer-books-screen.tsx";
import * as Stories from "./drawer-books-screen.stories.tsx";

describe("DrawerBooksScreen", () => {
  it("열쇠를 받은 손님에게 그 서랍의 책과 수량을 보여 준다", async () => {
    await runSiheom(
      given.render(<DrawerBooksScreen {...Stories.drawerBooksArgs.threeBooks} />),
      assertions.visible(query.heading("삶을 바꾸는 연습")),
      assertions.visible(query.heading("하루의 구조")),
      assertions.visible(query.heading("작은 실험")),
      assertions.a11ySnapshot(
        query.main("서랍 속 책 안내"),
        "drawer-books-screen.three-books.snap",
      ),
    );
  });

  it("산 책을 기록하면 그 책만 남기고, 처음으로를 누르면 돌아간다", async () => {
    const purchased: string[] = [];
    let finished = false;

    await runSiheom(
      given.render(
        <DrawerBooksScreen
          {...Stories.drawerBooksArgs.threeBooks}
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
    );

    expect(purchased).toStrictEqual(["book-b6-1"]);
    expect(finished).toBe(true);
  });

  it("수량 0인 책은 기록할 수 없다", async () => {
    await runSiheom(
      given.render(<DrawerBooksScreen {...Stories.drawerBooksArgs.threeBooks} />),
      assertions.disabled(query.button("하루의 구조 이 책 기록")),
    );
  });

  it("주인 확인 시간이 끝나면 산 책을 기록할 수 없고 그 이유를 보여 준다", async () => {
    await runSiheom(
      given.render(<DrawerBooksScreen {...Stories.drawerBooksArgs.tokenExpired} />),
      assertions.disabled(query.button("삶을 바꾸는 연습 이 책 기록")),
      assertions.textContent(
        query.status("산 책 기록 안내"),
        "주인 확인 시간이 끝나 산 책 기록은 할 수 없어요.",
      ),
      assertions.a11ySnapshot(
        query.main("서랍 속 책 안내"),
        "drawer-books-screen.token-expired.snap",
      ),
    );
  });
});
