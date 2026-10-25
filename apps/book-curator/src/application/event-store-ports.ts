import type { FunnelEvent } from "../domain/funnel.ts";

/**
 * 퍼널 이벤트 저장소. 추가 전용이고, 읽을 때는 넣은 순서를 그대로 지킨다.
 * 세션 ID로 거르면 그 차례의 이벤트만 나온다.
 */
export interface EventStore {
  append(events: readonly FunnelEvent[]): Promise<void>;
  list(sessionId?: string): Promise<FunnelEvent[]>;
}
