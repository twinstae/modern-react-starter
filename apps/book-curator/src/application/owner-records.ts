import type { HandoverStore } from "./owner-record-ports.ts";
import {
  parseHandoverInput,
  type HandoverInput,
  type HandoverRecord,
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
