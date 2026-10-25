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

/** 로그인 폼이 운영 API로 넘기는 값. 비밀번호는 화면 밖으로 저장하지 않는다. */
export interface AdminCredentials {
  email: string;
  password: string;
}

export function parseAdminMe(value: unknown): AdminMe {
  return v.parse(AdminMeSchema, value);
}
