import type { HandoverStore } from "../application/owner-record-ports.ts";
import {
  parseHandoverRecord,
  toHandoverRecordDto,
  type HandoverRecord,
} from "../domain/owner-record.ts";

/** 열쇠 건넴 기록을 프로세스 메모리에 추가 전용으로 둔다. */
export function createMemoryHandoverStore(): HandoverStore {
  const records: HandoverRecord[] = [];
  let nextId = 1;

  return {
    async append(input) {
      const record = parseHandoverRecord({ ...input, id: nextId++ });
      records.push(record);
      return toHandoverRecordDto(record);
    },
    async list(sessionId) {
      return records
        .filter((record) => sessionId === undefined || record.sessionId === sessionId)
        .map(toHandoverRecordDto);
    },
  };
}
