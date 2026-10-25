import { memoryAdapter } from "better-auth/adapters/memory";
import { betterAuth, type BetterAuthOptions } from "better-auth";

/** better-auth가 서명 쿠키를 만들 때 쓰는 비밀. 없으면 개발 기본값을 쓴다. */
export interface AuthOptions {
  secret?: string;
}

/**
 * 운영자 인증. elysia의 mount는 접두사를 떼지 않으므로 실제 경로와 같은 `/api/auth`를 쓴다.
 * 저장소는 테스트에서 메모리 어댑터, 운영·개발에서 drizzle 어댑터를 넣는다.
 */
export function createAuth(database: BetterAuthOptions["database"], { secret }: AuthOptions = {}) {
  return betterAuth({
    database,
    basePath: "/api/auth",
    emailAndPassword: {
      enabled: true,
    },
    ...(secret === undefined || secret === "" ? {} : { secret }),
  });
}

/** API 테스트용 실제 better-auth. PGlite 없이 메모리 어댑터 위에서 로그인한다. */
export function createMemoryAuth() {
  return createAuth(memoryAdapter({ user: [], session: [], account: [], verification: [] }));
}

export type AppAuth = ReturnType<typeof createAuth>;
