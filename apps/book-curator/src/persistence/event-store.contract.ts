import { beforeEach, describe, expect, it } from "vite-plus/test";

import type { EventStore } from "../application/event-store-ports.ts";
import { sampleFunnelEventOf, sampleFunnelEvents } from "../domain/funnel.fixture.ts";

/**
 * 메모리와 PGlite 구현이 함께 통과하는 이벤트 저장소 계약.
 * `setup`은 매 테스트마다 빈 저장소를 새로 준다.
 */
export function eventStoreContract(name: string, setup: () => Promise<EventStore>): void {
  describe(`${name} 이벤트 저장소 계약`, () => {
    let store: EventStore;

    beforeEach(async () => {
      store = await setup();
    });

    it("추가한 순서를 그대로 돌려준다", async () => {
      const first = sampleFunnelEvents("session-1");
      const second = sampleFunnelEvents("session-2");

      await store.append(first);
      await store.append(second);

      expect(await store.list()).toStrictEqual([...first, ...second]);
    });

    it("세션 ID로 거르고, 그 안에서는 들어온 순서를 지킨다", async () => {
      const first = sampleFunnelEvents("session-1");
      const second = sampleFunnelEvents("session-2");

      await store.append([first[0]!, second[0]!, first[1]!, second[1]!]);
      await store.append([first[2]!, second[2]!]);

      expect(await store.list("session-1")).toStrictEqual([first[0], first[1], first[2]]);
      expect(await store.list("session-2")).toStrictEqual([second[0], second[1], second[2]]);
      expect(await store.list("missing")).toStrictEqual([]);
    });

    it("빈 묶음을 추가해도 아무것도 바뀌지 않는다", async () => {
      await store.append([]);

      expect(await store.list()).toStrictEqual([]);
      expect(await store.list("session-1")).toStrictEqual([]);
    });

    it("kiosk_ready만 있는 세션도 순서대로 남는다", async () => {
      const ready = sampleFunnelEventOf("session-3", "kiosk_ready");

      await store.append([ready]);

      expect(await store.list("session-3")).toStrictEqual([ready]);
    });
  });
}
