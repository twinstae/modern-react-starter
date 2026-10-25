import fc from "fast-check";
import { describe, expect, it } from "vite-plus/test";

import { healthArbitrary } from "./health.arbitrary.ts";
import { parseHealth } from "./health.ts";

const HEALTH = { status: "ok", checkedAt: "2026-10-25T00:00:00.000Z" } as const;

describe("HealthSchema", () => {
  it("상태와 확인 시각이 있는 응답을 받는다", () => {
    expect(parseHealth(HEALTH)).toStrictEqual(HEALTH);
  });

  it("JSON 직렬화 왕복에도 같은 응답이다", () => {
    fc.assert(
      fc.property(healthArbitrary, (health) => {
        expect(parseHealth(JSON.parse(JSON.stringify(health)))).toStrictEqual(health);
      }),
    );
  });
});
