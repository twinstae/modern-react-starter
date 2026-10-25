import { beforeEach, describe, expect, it } from "vite-plus/test";

import type { HandoverStore, PurchaseStore } from "../application/owner-record-ports.ts";

export interface OwnerRecordStores {
  readonly handovers: HandoverStore;
  readonly purchases: PurchaseStore;
}

export type OwnerRecordStoreSetup = () => Promise<OwnerRecordStores>;

const HANDOVER = {
  sessionId: "session-1",
  version: 3,
  recommended: "B6",
  handed: "B1",
} as const;

const PURCHASE = {
  sessionId: "session-1",
  version: 3,
  drawer: "B1",
  bookId: "book-b1-1",
} as const;

const withoutId = <T extends { readonly id: number }>(record: T): Omit<T, "id"> => {
  const { id: _id, ...rest } = record;
  return rest;
};

/**
 * 메모리와 PGlite 구현이 함께 통과하는 주인 기록 저장소 계약.
 * 두 기록 모두 추가 전용이고, 넣은 순서를 지키며, 세션 ID로 거를 수 있다.
 */
export function ownerRecordStoreContract(name: string, setup: OwnerRecordStoreSetup): void {
  describe(`${name} 주인 기록 저장소 계약`, () => {
    let stores: OwnerRecordStores;

    beforeEach(async () => {
      stores = await setup();
    });

    it("열쇠 건넴에 추천과 건넨 서랍, 버전을 함께 남긴다(R-7, I-16)", async () => {
      const record = await stores.handovers.append(HANDOVER);

      expect(record.id).toBeGreaterThan(0);
      expect(withoutId(record)).toStrictEqual(HANDOVER);
      expect(await stores.handovers.list("session-1")).toStrictEqual([record]);
    });

    it("같은 세션에서 추천과 다른 서랍을 여러 번 건네도 모두 남는다", async () => {
      await stores.handovers.append(HANDOVER);
      await stores.handovers.append({ ...HANDOVER, handed: "B6" });

      expect((await stores.handovers.list("session-1")).map(withoutId)).toStrictEqual([
        HANDOVER,
        { ...HANDOVER, handed: "B6" },
      ]);
      expect(await stores.handovers.list("session-2")).toStrictEqual([]);
    });

    it("산 책을 추가 전용으로 남기고 세션 ID로 거른다", async () => {
      const first = await stores.purchases.append(PURCHASE);
      const second = await stores.purchases.append({ ...PURCHASE, bookId: "book-b1-2" });
      await stores.purchases.append({ ...PURCHASE, sessionId: "session-2" });

      expect(withoutId(first)).toStrictEqual(PURCHASE);
      expect(withoutId(second)).toStrictEqual({ ...PURCHASE, bookId: "book-b1-2" });
      expect(await stores.purchases.list("session-1")).toStrictEqual([first, second]);
      expect(await stores.purchases.list()).toHaveLength(3);
    });

    it("버전 없이 저장하지 않는다(I-16)", async () => {
      const withoutVersion = { sessionId: "session-1", recommended: "B6", handed: "B1" };

      await expect(stores.handovers.append(withoutVersion as never)).rejects.toThrow();
      expect(await stores.handovers.list()).toStrictEqual([]);
    });

    it("모르는 서랍 코드와 빈 세션 ID를 거부한다", async () => {
      await expect(
        stores.handovers.append({ ...HANDOVER, recommended: "B9" as never }),
      ).rejects.toThrow();
      await expect(stores.handovers.append({ ...HANDOVER, sessionId: "" })).rejects.toThrow();
      await expect(
        stores.purchases.append({ ...PURCHASE, drawer: "B9" as never }),
      ).rejects.toThrow();
      expect(await stores.handovers.list()).toStrictEqual([]);
      expect(await stores.purchases.list()).toStrictEqual([]);
    });
  });
}
