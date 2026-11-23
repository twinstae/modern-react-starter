import * as v from "valibot";

/** 운영 비밀번호의 최소 길이. 주인 PIN(숫자 6자리)과 헷갈리지 않게 더 길게 둔다. */
export const ADMIN_PASSWORD_MIN_LENGTH = 8;

export const AdminPasswordSchema = v.pipe(
  v.string(),
  v.minLength(
    ADMIN_PASSWORD_MIN_LENGTH,
    `비밀번호는 ${ADMIN_PASSWORD_MIN_LENGTH}자 이상이어야 해요`,
  ),
);

/** 처음 정할 때는 두 번 넣어 오타를 막는다. */
export const AdminPasswordSetupSchema = v.pipe(
  v.object({ password: AdminPasswordSchema, confirm: v.string() }),
  v.forward(
    v.partialCheck(
      [["password"], ["confirm"]],
      ({ password, confirm }) => password === confirm,
      "두 비밀번호가 같지 않아요",
    ),
    ["confirm"],
  ),
);

export function parseAdminPassword(value: unknown): string {
  return v.parse(AdminPasswordSchema, value);
}
