import { atom, createStore } from "jotai";

import { createEventQueue, type EventSender } from "./application/event-queue.ts";
import {
  CLOSED,
  nextKioskSession,
  type KioskAction,
  type KioskSession,
} from "./domain/kiosk-session.ts";

/** 손님 차례의 메모리 상태. 별명·답·주인 토큰은 여기에만 있고 URL·저장소에 쓰지 않는다(I-12, I-15). */
export const kioskSessionAtom = atom<KioskSession>(CLOSED);

/**
 * 키오스크 한 대의 상태 저장소. `dispatch`는 순수 전이를 적용하고 나온 퍼널 이벤트를
 * 큐에 넣는다. 전송은 최선이다. 실패해도 큐가 남고, 손님 흐름은 기다리지 않는다.
 * 라우터 context로 넘겨 라우트 guard도 같은 세션을 읽는다.
 */
export function createKiosk(send: EventSender) {
  const store = createStore();
  const queue = createEventQueue(send);

  return {
    store,
    session: () => store.get(kioskSessionAtom),
    dispatch: (action: KioskAction) => {
      const { session, events } = nextKioskSession(store.get(kioskSessionAtom), action);
      store.set(kioskSessionAtom, session);
      if (events.length === 0) return;
      queue.enqueue(events);
      void queue.flush();
    },
  };
}

export type Kiosk = ReturnType<typeof createKiosk>;
