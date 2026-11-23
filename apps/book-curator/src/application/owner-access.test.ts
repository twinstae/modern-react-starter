import { describe, expect, it } from "vite-plus/test";

import { createMemoryOwnerAccessStore } from "../persistence/memory-owner-access-store.ts";
import { generateOwnerPin, unlockOwner } from "./owner-access.ts";

const NOW = "2026-10-25T00:00:00.000Z";
const PIN = "482913";
const WRONG_PIN = "000000";

const plus = (iso: string, ms: number): string => new Date(Date.parse(iso) + ms).toISOString();

describe("주인 PIN 잠금", () => {
  it("PIN을 정하기 전에는 주인 확인을 열 수 없다", async () => {
    expect(await unlockOwner(createMemoryOwnerAccessStore(), PIN, NOW)).toStrictEqual({
      status: "no-pin",
    });
  });

  it("맞는 PIN이면 주인 확인을 10분 연다", async () => {
    const store = createMemoryOwnerAccessStore();
    await generateOwnerPin(store, () => PIN);

    expect(await unlockOwner(store, PIN, NOW)).toStrictEqual({
      status: "unlocked",
      expiresAt: "2026-10-25T00:10:00.000Z",
    });
  });

  it("PIN을 다시 생성하면 새 PIN으로만 열린다", async () => {
    const store = createMemoryOwnerAccessStore();
    await generateOwnerPin(store, () => "111111");
    await generateOwnerPin(store, () => "222222");

    expect((await unlockOwner(store, "111111", NOW)).status).toBe("invalid");
    expect((await unlockOwner(store, "222222", NOW)).status).toBe("unlocked");
  });

  it("틀린 PIN이 5번 이어지면 잠그고, 잠긴 동안은 맞는 PIN도 받지 않다가 60초 뒤에 연다", async () => {
    const store = createMemoryOwnerAccessStore();
    await generateOwnerPin(store, () => PIN);

    const attempts = [];
    for (let attempt = 0; attempt < 5; attempt += 1) {
      attempts.push((await unlockOwner(store, WRONG_PIN, NOW)).status);
    }

    expect(attempts).toStrictEqual(["invalid", "invalid", "invalid", "invalid", "locked"]);
    expect((await unlockOwner(store, PIN, plus(NOW, 59_000))).status).toBe("locked");
    expect((await unlockOwner(store, PIN, plus(NOW, 60_000))).status).toBe("unlocked");
  });
});
