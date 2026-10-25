import type { HandoverStore, PurchaseStore } from "./owner-record-ports.ts";
import type { DrawerStockStore } from "./shelf-ports.ts";
import {
  parseHandoverInput,
  parsePurchaseInput,
  type HandoverInput,
  type HandoverRecord,
  type PurchaseInput,
  type PurchaseRecord,
} from "../domain/owner-record.ts";

/**
 * 주인이 건넨 서랍을 기록한다. 추천과 건넨 서랍을 모두 저장해 R-7의 비교가 남는다.
 * 기록은 추가 전용이고, 같은 차례에서 다시 건네도 앞의 기록을 고치지 않는다.
 */
export async function recordHandover(
  store: HandoverStore,
  input: HandoverInput,
): Promise<HandoverRecord> {
  return store.append(parseHandoverInput(input));
}

/** 산 책 기록과, 그 서랍에서 줄어든 수량. 수량은 참고이고 0이어도 기록은 남긴다(R-9). */
export interface PurchaseResult {
  readonly record: PurchaseRecord;
  readonly quantity: number;
}

/**
 * 산 책을 먼저 기록하고 그 서랍의 수량을 1 줄인다. 수량 줄이기는 원자적이라
 * 두 주인이 동시에 기록해도 0 아래로 내려가거나 읽고-고치는 경쟁이 생기지 않는다.
 * 서랍에 그 책 줄이 없으면 기록만 남기고 수량은 0으로 답한다(R-9).
 */
export async function recordPurchase(
  purchases: PurchaseStore,
  stock: DrawerStockStore,
  input: PurchaseInput,
): Promise<PurchaseResult> {
  const parsed = parsePurchaseInput(input);
  const record = await purchases.append(parsed);
  const quantity = await stock.decrease(parsed.drawer, parsed.bookId, 1);
  return { record, quantity };
}
