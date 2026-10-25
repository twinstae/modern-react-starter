import type { EventStore } from "../application/event-store-ports.ts";
import { type FunnelEvent, parseFunnelEvent, toFunnelEventDto } from "../domain/funnel.ts";

/**
 * 이벤트를 프로세스 메모리에 둔다. 넣을 때와 읽을 때 모두 명시적 DTO를 거쳐,
 * 넘긴 객체가 나중에 바뀌어도 저장된 값은 그대로 남는다.
 */
export function createMemoryEventStore(): EventStore {
  const events: FunnelEvent[] = [];

  return {
    async append(batch) {
      for (const event of batch) {
        events.push(parseFunnelEvent(toFunnelEventDto(event)));
      }
    },
    async list(sessionId) {
      return events
        .filter((event) => sessionId === undefined || event.sessionId === sessionId)
        .map((event) => parseFunnelEvent(toFunnelEventDto(event)));
    },
  };
}
