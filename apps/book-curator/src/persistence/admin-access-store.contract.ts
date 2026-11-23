import { beforeEach, describe, expect, it } from "vite-plus/test";

import type { AdminAccessStore } from "../application/admin-access-ports.ts";

/** 메모리와 IndexedDB가 함께 통과하는 운영 비밀번호 저장소 계약. */
export function adminAccessStoreContract(
  name: string,
  setup: () => Promise<AdminAccessStore>,
): void {
  describe(`${name} 운영 비밀번호 저장소 계약`, () => {
    let store: AdminAccessStore;

    beforeEach(async () => {
      store = await setup();
    });

    it("정하기 전에는 비어 있고, 저장한 해시를 다시 읽는다", async () => {
      expect(await store.read()).toBeNull();
      await store.save("pbkdf2-sha256$1$aa$bb");
      expect(await store.read()).toBe("pbkdf2-sha256$1$aa$bb");
    });
  });
}
