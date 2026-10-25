import { beforeEach, expect, it } from "vite-plus/test";

import type { OwnerAccessStore } from "../application/owner-access-ports.ts";

const NOW = "2026-10-25T00:00:00.000Z";
const LATER = "2026-10-25T00:10:00.000Z";

/**
 * 메모리와 PGlite가 함께 통과하는 주인 잠금 저장소 계약. 해시만 저장하는지,
 * 만료된 토큰을 거부하는지, 잠금 상태를 덮어쓰는지 본다.
 * 부르는 쪽의 `describe` 안에서 쓴다.
 */
export function ownerAccessStoreContract(createStore: () => Promise<OwnerAccessStore>): void {
  let store: OwnerAccessStore;

  beforeEach(async () => {
    store = await createStore();
  });

  it("PIN을 저장하기 전에는 비어 있다", async () => {
    expect(await store.read()).toBeNull();
  });

  it("PIN 해시와 실패 횟수를 저장하고 다시 읽는다", async () => {
    await store.save({ pinHash: "scrypt$salt$abc", failedAttempts: 2, lockedUntil: null });

    expect(await store.read()).toStrictEqual({
      pinHash: "scrypt$salt$abc",
      failedAttempts: 2,
      lockedUntil: null,
    });
  });

  it("잠금 상태를 덮어쓴다", async () => {
    await store.save({ pinHash: "scrypt$salt$abc", failedAttempts: 5, lockedUntil: LATER });

    expect((await store.read())?.lockedUntil).toBe(LATER);
  });

  it("만료 전 토큰만 유효하다", async () => {
    await store.addToken("token-hash", LATER);

    expect(await store.hasValidToken("token-hash", NOW)).toBe(true);
    expect(await store.hasValidToken("token-hash", LATER)).toBe(false);
    expect(await store.hasValidToken("other-hash", NOW)).toBe(false);
  });
}
