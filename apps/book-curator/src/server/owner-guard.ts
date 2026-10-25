import { Elysia } from "elysia";

import type { OwnerAccessStore } from "../application/owner-access-ports.ts";
import { verifyOwnerToken } from "../application/owner-access.ts";

/** `Authorization: Bearer <token>`만 받는다. 토큰을 URL·쿠키·저장소에 두지 않는다(I-15). */
export function bearerToken(header: string | null): string | undefined {
  if (header === null) return undefined;
  const [scheme, token, ...rest] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || token === undefined || rest.length > 0) {
    return undefined;
  }
  return token;
}

/**
 * 주인 확인 API를 감싸는 매크로. 짧게 사는 주인 토큰이 없거나 만료됐으면 401이다.
 * 주인 확인 방식을 휴대폰으로 바꿔도 이 경계는 그대로 둘 수 있다(C-4).
 */
export function createOwnerGuard(store: OwnerAccessStore, now: () => string) {
  return new Elysia({ name: "owner-guard" }).macro({
    ownerToken: {
      async resolve({ status, request: { headers } }) {
        const token = bearerToken(headers.get("authorization"));
        if (token === undefined || !(await verifyOwnerToken(store, token, now()))) {
          return status(401, { code: "OWNER_TOKEN_REQUIRED" });
        }
        return { owner: true } as const;
      },
    },
  });
}
