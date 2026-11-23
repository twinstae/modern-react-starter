import { describe, expect, it } from "vite-plus/test";

import { createMemoryAdminAccessStore } from "../persistence/memory-admin-access-store.ts";
import { hasAdminPassword, setupAdminPassword, verifyAdminPassword } from "./admin-access.ts";

describe("운영 비밀번호", () => {
  it("처음 정한 비밀번호로만 들어간다", async () => {
    const store = createMemoryAdminAccessStore();
    expect(await verifyAdminPassword(store, "bookshop-79-1")).toBe("unset");

    expect(await setupAdminPassword(store, "bookshop-79-1")).toBe("saved");

    expect(await hasAdminPassword(store)).toBe(true);
    expect(await verifyAdminPassword(store, "bookshop-79-1")).toBe("ok");
    expect(await verifyAdminPassword(store, "bookshop-79-2")).toBe("invalid");
  });

  it("이미 정했으면 다시 정해도 앞 비밀번호가 그대로다", async () => {
    const store = createMemoryAdminAccessStore();
    await setupAdminPassword(store, "bookshop-79-1");

    expect(await setupAdminPassword(store, "someone-else")).toBe("already-set");
    expect(await verifyAdminPassword(store, "bookshop-79-1")).toBe("ok");
  });

  it("8자보다 짧은 비밀번호는 정하지 않는다", async () => {
    const store = createMemoryAdminAccessStore();
    await expect(setupAdminPassword(store, "1234")).rejects.toThrow();
    expect(await hasAdminPassword(store)).toBe(false);
  });
});
