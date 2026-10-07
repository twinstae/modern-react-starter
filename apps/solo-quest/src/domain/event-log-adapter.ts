import type { Adapter } from "ventyd";
import * as v from "valibot";

import type { EventLogStore } from "./event-log-store.ts";
import { SessionEventSchema, type sessionSchema } from "./session.ts";

/**
 * 이벤트 로그 저장소를 ventyd 어댑터로 바꾼다. 충돌은 저장소가 던지는 예외를 그대로 전달한다.
 * 메모리 저장소(테스트, Storybook)와 HTTP 저장소(브라우저)가 같은 어댑터를 쓴다.
 */
export function createEventLogAdapter(store: EventLogStore): Adapter<typeof sessionSchema> {
  return {
    getEventsByEntityId: ({ entityId }) => store.read(entityId),
    async commitEvents({ entityId, events, expectedVersion }) {
      // repository가 넘기는 이벤트는 버전이 붙어 있다. 저장소는 버전이 있는 이벤트만 받는다.
      await store.append(
        entityId,
        expectedVersion ?? 0,
        events.map((event) => v.parse(SessionEventSchema, event)),
      );
    },
  };
}
