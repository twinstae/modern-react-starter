import { beforeEach, describe, expect, it } from "vite-plus/test";

import type { PublishedVersionStore } from "../application/published-version-ports.ts";
import { snapshotOf } from "../domain/kiosk.ts";
import { SEED_DRAWERS } from "../domain/seed-question-set.ts";

const FIRST = snapshotOf(SEED_DRAWERS);
const SECOND = snapshotOf(SEED_DRAWERS.slice(0, 2));

/** 메모리와 PGlite 구현이 함께 통과하는 공개 버전 저장소 계약. */
export function publishedVersionStoreContract(
  name: string,
  setup: () => Promise<PublishedVersionStore>,
): void {
  describe(`${name} 공개 버전 저장소 계약`, () => {
    let store: PublishedVersionStore;

    beforeEach(async () => {
      store = await setup();
    });

    it("공개 버전이 없으면 목록과 현재 버전이 비어 있다", async () => {
      expect(await store.list()).toStrictEqual([]);
      expect(await store.current()).toBeNull();
    });

    it("다시 공개하면 다음 버전을 더하고 앞 버전은 그대로 둔다(I-11)", async () => {
      const first = await store.publish(FIRST);
      const second = await store.publish(SECOND);

      expect(first).toStrictEqual({ version: 1, ...FIRST });
      expect(second).toStrictEqual({ version: 2, ...SECOND });
      expect(await store.list()).toStrictEqual([first, second]);
      expect(await store.current()).toStrictEqual(second);
    });
  });
}
