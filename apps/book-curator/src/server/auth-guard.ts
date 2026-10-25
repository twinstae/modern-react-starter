import { Elysia } from "elysia";

import type { AppAuth } from "./auth.ts";

/**
 * 운영 API를 감싸는 매크로. 세션은 better-auth에 묻고, 없으면 401이다.
 * 운영 역할을 나중에 나누더라도 이 한 곳만 고치면 된다(C-6).
 */
export function createAuthGuard(auth: AppAuth) {
  return new Elysia({ name: "auth-guard" }).macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers });
        if (!session) return status(401, { code: "UNAUTHENTICATED" });
        return { user: session.user, session: session.session };
      },
    },
  });
}
