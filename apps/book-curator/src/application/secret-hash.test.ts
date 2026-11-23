import { describe, expect, it } from "vite-plus/test";

import { hashSecret, matchesSecret, randomBelow } from "./secret-hash.ts";

describe("PIN·비밀번호 해시", () => {
  it("맞는 값만 통과하고, 저장된 해시에 원문이 없다", async () => {
    const stored = await hashSecret("482913");

    expect(stored).not.toContain("482913");
    expect(await matchesSecret("482913", stored)).toBe(true);
    expect(await matchesSecret("482914", stored)).toBe(false);
  });

  it("같은 값도 해시할 때마다 salt가 달라 해시가 다르다", async () => {
    expect(await hashSecret("482913")).not.toBe(await hashSecret("482913"));
  });

  it("모르는 형식의 해시는 틀린 것으로 본다", async () => {
    expect(await matchesSecret("482913", "scrypt$salt$abc")).toBe(false);
    expect(await matchesSecret("482913", "")).toBe(false);
  });

  it("난수는 늘 0 이상 상한 미만이다", () => {
    const values = Array.from({ length: 200 }, () => randomBelow(10));
    expect(values.every((value) => Number.isInteger(value) && value >= 0 && value < 10)).toBe(true);
  });
});
