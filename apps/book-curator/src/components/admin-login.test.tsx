import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { AdminLogin } from "./admin-login.tsx";
import * as Stories from "./admin-login.stories.tsx";

describe("AdminLogin", () => {
  it("처음에는 비밀번호를 두 번 넣어 정하고 운영자 화면으로 들어간다", async () => {
    let submitted: string | undefined;
    let succeeded = false;

    await runSiheom(
      given.render(
        <AdminLogin
          {...Stories.adminSetupArgs}
          onSubmit={async (password) => {
            submitted = password;
            return undefined;
          }}
          onSuccess={() => {
            succeeded = true;
          }}
        />,
      ),
      actions.fill(query.label("새 비밀번호"), "bookshop-79-1"),
      actions.fill(query.label("한 번 더"), "bookshop-79-1"),
      actions.click(query.button("정하고 들어가기")),
    );

    expect(submitted).toBe("bookshop-79-1");
    expect(succeeded).toBe(true);
  });

  it("두 비밀번호가 다르면 정하지 않고 그 까닭을 보여 준다", async () => {
    let submitted = false;

    await runSiheom(
      given.render(
        <AdminLogin
          {...Stories.adminSetupArgs}
          onSubmit={async () => {
            submitted = true;
            return undefined;
          }}
        />,
      ),
      actions.fill(query.label("새 비밀번호"), "bookshop-79-1"),
      actions.fill(query.label("한 번 더"), "bookshop-79-2"),
      actions.click(query.button("정하고 들어가기")),
      assertions.description(query.label("한 번 더"), "두 비밀번호가 같지 않아요"),
    );

    expect(submitted).toBe(false);
  });

  it("비밀번호가 맞지 않으면 그 이유를 보여 준다", async () => {
    await runSiheom(
      given.render(
        <AdminLogin {...Stories.adminLoginArgs} onSubmit={async () => "비밀번호가 맞지 않아요"} />,
      ),
      actions.fill(query.label("비밀번호"), "wrong-password"),
      actions.click(query.button("로그인")),
      assertions.visible(query.alert("비밀번호가 맞지 않아요")),
    );
  });
});
