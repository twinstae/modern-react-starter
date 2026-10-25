import fc from "fast-check";

import type { Health } from "./health.ts";

/** health 응답 생성기. 속성 테스트가 같은 모양을 쓴다. */
export const healthArbitrary: fc.Arbitrary<Health> = fc
  .record({
    status: fc.constant("ok"),
    // valibot의 ISO 시각 스키마는 네 자리 연도를 요구한다. 범위를 좁혀 연도 표기 자체를 흔들지 않는다.
    checkedAt: fc
      .date({
        min: new Date("2000-01-01T00:00:00Z"),
        max: new Date("2100-01-01T00:00:00Z"),
        noInvalidDate: true,
      })
      .map((date) => date.toISOString()),
  })
  // fast-check v4의 record는 null 프로토타입 객체를 만든다. JSON 왕복 결과와 비교하려면 평범한 객체로 바꾼다.
  .map(({ status, checkedAt }) => ({ status, checkedAt }));
