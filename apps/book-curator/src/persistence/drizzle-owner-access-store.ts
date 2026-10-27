import { and, eq, gt } from "drizzle-orm";

import type { OwnerAccessStore } from "../application/owner-access-ports.ts";
import type { Database } from "./database.ts";
import { ownerAccess, ownerTokens } from "./schema.ts";

const OWNER_ROW_ID = "owner";

/**
 * PIN은 한 줄만 두고, 토큰은 해시를 기본 키로 쌓는다.
 */
export function createDrizzleOwnerAccessStore(db: Database): OwnerAccessStore {
  return {
    async read() {
      const [row] = await db.select().from(ownerAccess).where(eq(ownerAccess.id, OWNER_ROW_ID));

      return row === undefined
        ? null
        : {
            pinHash: row.pinHash,
            failedAttempts: row.failedAttempts,
            // 드라이버가 시간대가 붙은 문자열을 돌려준다. 포트는 ISO 하나로 맞춘다.
            lockedUntil: row.lockedUntil === null ? null : new Date(row.lockedUntil).toISOString(),
          };
    },
    async save(access) {
      const values = {
        id: OWNER_ROW_ID,
        pinHash: access.pinHash,
        failedAttempts: access.failedAttempts,
        lockedUntil: access.lockedUntil,
      };
      await db
        .insert(ownerAccess)
        .values(values)
        .onConflictDoUpdate({
          target: ownerAccess.id,
          set: {
            pinHash: values.pinHash,
            failedAttempts: values.failedAttempts,
            lockedUntil: values.lockedUntil,
          },
        });
    },
    async addToken(tokenHash, expiresAt) {
      await db.insert(ownerTokens).values({ tokenHash, expiresAt }).onConflictDoUpdate({
        target: ownerTokens.tokenHash,
        set: { expiresAt },
      });
    },
    async hasValidToken(tokenHash, now) {
      const [row] = await db
        .select({ tokenHash: ownerTokens.tokenHash })
        .from(ownerTokens)
        .where(and(eq(ownerTokens.tokenHash, tokenHash), gt(ownerTokens.expiresAt, now)))
        .limit(1);
      return row !== undefined;
    },
  };
}
