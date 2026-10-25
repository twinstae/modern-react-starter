import * as v from "valibot";

/** 운영자 세션 응답의 경계 스키마. 서버 응답과 화면이 같은 스키마를 쓴다. */
export const AdminMeSchema = v.strictObject({
  user: v.strictObject({
    id: v.string(),
    name: v.string(),
    email: v.string(),
  }),
});

export type AdminMe = v.InferOutput<typeof AdminMeSchema>;

export function parseAdminMe(value: unknown): AdminMe {
  return v.parse(AdminMeSchema, value);
}
