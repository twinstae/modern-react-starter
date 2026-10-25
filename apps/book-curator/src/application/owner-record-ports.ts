import type {
  HandoverInput,
  HandoverRecord,
  PurchaseInput,
  PurchaseRecord,
} from "../domain/owner-record.ts";

/**
 * 열쇠 건넴 기록. 추가 전용이고, 넣은 순서를 그대로 읽는다.
 * 추천 서랍과 건넨 서랍을 함께 남겨 R-7의 비교가 가능하다.
 */
export interface HandoverStore {
  append(input: HandoverInput): Promise<HandoverRecord>;
  list(sessionId?: string): Promise<HandoverRecord[]>;
}

/**
 * 산 책 기록. 추가 전용이다. 같은 책을 여러 번 기록할 수 있고, 수량은 서랍 저장소가
 * 따로 줄인다. 기록을 지우거나 고치지 않는다.
 */
export interface PurchaseStore {
  append(input: PurchaseInput): Promise<PurchaseRecord>;
  list(sessionId?: string): Promise<PurchaseRecord[]>;
}
