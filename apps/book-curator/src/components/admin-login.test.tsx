import { describe, expect, it } from "vite-plus/test";
import { actions, assertions, given, query, runSiheom } from "@siheom/react";

import type { AdminCredentials } from "../admin-dto.ts";
import { AdminLogin } from "./admin-login.tsx";
import * as Stories from "./admin-login.stories.tsx";

describe("AdminLogin", () => {
  it("이메일과 비밀번호를 넣으면 운영자 화면으로 들어간다", async () => {
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

  it("이메일이나 비밀번호가 맞지 않으면 그 이유를 보여 준다", async () => {
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
      assertions.visible(query.alert("이메일이나 비밀번호가 맞지 않아요")),
    );
  });
});
