import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq } from "drizzle-orm";

import { openConfiguredDatabase } from "../src/persistence/database.ts";
import { createAuth } from "../src/server/auth.ts";
import { user } from "../src/persistence/schema.ts";

/**
 * 운영자 계정 시드. 가입 화면은 없다(티켓). 같은 이메일이 이미 있으면 아무것도 바꾸지 않는다.
 * 비밀번호는 better-auth의 해시로만 저장되고 로그에 남기지 않는다.
 */
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "운영자";

if (email === undefined || email === "" || password === undefined || password === "") {
  throw new Error("ADMIN_EMAIL과 ADMIN_PASSWORD를 환경 변수로 넣어 주세요");
}

const { db, close } = await openConfiguredDatabase();

try {
  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
  if (existing !== undefined) {
    console.log(`${email} 운영자 계정이 이미 있어 그대로 둡니다.`);
  } else {
    const auth = createAuth(drizzleAdapter(db, { provider: "pg" }), {
      secret: process.env.BETTER_AUTH_SECRET,
    });
    await auth.api.signUpEmail({ body: { name, email, password } });
    console.log(`${email} 운영자 계정을 만들었습니다.`);
  }
} finally {
  await close();
}
