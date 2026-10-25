import * as v from "valibot";

/**
 * 서버가 살아 있음을 알리는 응답의 경계 스키마. 모르는 필드는 거부한다.
 * 서버 응답과 API 테스트가 같은 스키마를 쓰고, 타입은 여기서만 추론한다.
 */
export const HealthSchema = v.strictObject({
  status: v.literal("ok"),
  checkedAt: v.pipe(v.string(), v.isoTimestamp()),
});

export type Health = v.InferOutput<typeof HealthSchema>;

export function parseHealth(value: unknown): Health {
  return v.parse(HealthSchema, value);
}
