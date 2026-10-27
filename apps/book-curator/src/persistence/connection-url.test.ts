import { describe, expect, it } from "vite-plus/test";

import { describeConnection, encodeConnectionPassword } from "./connection-url.ts";

describe("encodeConnectionPassword", () => {
  it("비밀번호의 #, &, @를 인코딩해 URL로 읽히게 한다", () => {
    const url = encodeConnectionPassword(
      "postgresql://user.ref:p#a&s@s@host.example:6543/postgres",
    );

    expect(url).toBe("postgresql://user.ref:p%23a%26s%40s@host.example:6543/postgres");
    expect(new URL(url).hostname).toBe("host.example");
  });

  it("이미 인코딩한 비밀번호는 다시 인코딩하지 않는다", () => {
    const url = "postgresql://user:p%23ss@host.example:5432/postgres";

    expect(encodeConnectionPassword(url)).toBe(url);
  });

  it("비밀번호가 없으면 그대로 둔다", () => {
    const url = "postgresql://host.example:5432/postgres";

    expect(encodeConnectionPassword(url)).toBe(url);
  });
});

describe("describeConnection", () => {
  it("로그에는 비밀번호 없이 어느 DB에 붙는지만 남긴다", () => {
    expect(describeConnection("postgresql://user.ref:p#a&s@s@host.example:6543/postgres")).toBe(
      "Postgres user.ref@host.example:6543/postgres",
    );
  });

  it("URL로 읽지 못하면 내용을 남기지 않는다", () => {
    expect(describeConnection("주소가 아님")).toBe("Postgres (URL을 읽지 못함)");
  });
});
