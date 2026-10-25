import type { OwnerAccess, OwnerAccessStore } from "../application/owner-access-ports.ts";

/** API 테스트와 계약 테스트가 쓰는 메모리 저장소. 프로세스가 끝나면 사라진다. */
export function createMemoryOwnerAccessStore(): OwnerAccessStore {
  let access: OwnerAccess | null = null;
  const tokens = new Map<string, string>();

  return {
    async read() {
      return access;
    },
    async save(next) {
      access = next;
    },
    async addToken(tokenHash, expiresAt) {
      tokens.set(tokenHash, expiresAt);
    },
    async hasValidToken(tokenHash, now) {
      const expiresAt = tokens.get(tokenHash);
      return expiresAt !== undefined && Date.parse(expiresAt) > Date.parse(now);
    },
  };
}
