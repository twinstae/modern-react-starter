import type { AdminAccessStore } from "../application/admin-access-ports.ts";

export function createMemoryAdminAccessStore(): AdminAccessStore {
  let passwordHash: string | null = null;
  return {
    async read() {
      return passwordHash;
    },
    async save(next) {
      passwordHash = next;
    },
  };
}
