import { describe, expect, it } from "vite-plus/test";

import { IDLE_LIMITS, idleState } from "./idle.ts";

const START = 1_000_000;

describe("유휴 상태", () => {
  it("기준 시간 전에는 활동 중이다", () => {
    expect(idleState(START, START + 89_999)).toBe("active");
  });

  it("한 번 물어보는 구간에 들어가면 prompt다", () => {
    expect(idleState(START, START + IDLE_LIMITS.promptAfterMs)).toBe("prompt");
    expect(idleState(START, START + IDLE_LIMITS.expireAfterMs - 1)).toBe("prompt");
  });

  it("만료 시간이 되면 expired다", () => {
    expect(idleState(START, START + IDLE_LIMITS.expireAfterMs)).toBe("expired");
  });

  it("활동 시각을 지금으로 옮기면 다시 활동 중이다", () => {
    const now = START + IDLE_LIMITS.expireAfterMs;

    expect(idleState(START, now)).toBe("expired");
    expect(idleState(now, now)).toBe("active");
  });

  it("시계가 뒤로 가도 만료로 보지 않는다", () => {
    expect(idleState(START, START - 1_000)).toBe("active");
  });
});
