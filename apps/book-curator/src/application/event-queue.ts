import type { FunnelEvent } from "../domain/funnel.ts";

export type EventSender = (events: readonly FunnelEvent[]) => Promise<void>;

export interface EventQueue {
  enqueue(events: readonly FunnelEvent[]): void;
  /** 대기 중인 이벤트를 순서대로 보낸다. 실패하면 대기 목록을 그대로 두고 false를 돌려준다. */
  flush(): Promise<boolean>;
}

/**
 * 이벤트를 메모리에 쌓아 두고 보내는 큐. localStorage·sessionStorage를 쓰지 않는다.
 * 전송은 최선이고, 실패해도 손님 흐름을 막지 않는다. 다음 flush가 남은 것부터 다시 보낸다.
 */
export function createEventQueue(send: EventSender): EventQueue {
  let pending: FunnelEvent[] = [];
  let inFlight: Promise<boolean> | null = null;

  const flush = async (): Promise<boolean> => {
    while (pending.length > 0) {
      const batch = [...pending];
      try {
        await send(batch);
      } catch {
        return false;
      }
      // 보내는 동안 새로 쌓인 이벤트는 다음 바퀴가 이어서 보낸다.
      pending = pending.slice(batch.length);
    }
    return true;
  };

  return {
    enqueue(events) {
      pending.push(...events);
    },
    flush() {
      inFlight ??= flush().finally(() => {
        inFlight = null;
      });
      return inFlight;
    },
  };
}
