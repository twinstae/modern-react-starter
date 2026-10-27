import type { HandoverInput, HandoverRecord } from "../domain/owner-record.ts";

/**
 * 열쇠 건넴 기록. 추가 전용이고, 넣은 순서를 그대로 읽는다.
 * 추천 서랍과 건넨 서랍을 함께 남겨 R-7의 비교가 가능하다.
 */
export interface HandoverStore {
  append(input: HandoverInput): Promise<HandoverRecord>;
  list(sessionId?: string): Promise<HandoverRecord[]>;
}
