import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import { AdminLogin, type AdminCredentials } from "./admin-login.tsx";
import * as Stories from "./admin-login.stories.tsx";

describe("AdminLogin", () => {
  it("이메일과 비밀번호를 onSubmit에 넘기고, 성공하면 onSuccess를 부른다", async () => {
    let submitted: AdminCredentials | undefined;
    let succeeded = false;

    await runSiheom(
      given.render(
        <AdminLogin
          {...Stories.adminLoginArgs}
          onSubmit={async (credentials) => {
            submitted = credentials;
            return undefined;
          }}
          onSuccess={() => {
            succeeded = true;
          }}
        />,
      ),
      actions.fill(query.label("이메일"), "owner@example.com"),
      actions.fill(query.label("비밀번호"), "bookshop-79-1"),
      actions.click(query.button("로그인")),
    );

    expect(submitted).toStrictEqual({
      email: "owner@example.com",
      password: "bookshop-79-1",
    });
    expect(succeeded).toBe(true);
  });

  it("로그인 실패 문구를 보여 준다", async () => {
    await runSiheom(
      given.render(
        <AdminLogin
          {...Stories.adminLoginArgs}
          onSubmit={async () => "이메일이나 비밀번호가 맞지 않아요"}
        />,
      ),
      actions.fill(query.label("이메일"), "owner@example.com"),
      actions.fill(query.label("비밀번호"), "wrong-password"),
      actions.click(query.button("로그인")),
      assertions.errormessage(query.label("비밀번호"), "이메일이나 비밀번호가 맞지 않아요"),
    );
  });
});
