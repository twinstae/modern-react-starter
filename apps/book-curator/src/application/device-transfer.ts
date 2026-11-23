import {
  drawersFileOf,
  recordsFileOf,
  type DrawersFile,
  type RecordsFile,
} from "../domain/device-transfer.ts";
import type { Drawer } from "../domain/drawer.ts";
import type { DrawerStore } from "./drawer-ports.ts";
import type { EventStore } from "./event-store-ports.ts";
import type { HandoverStore } from "./owner-record-ports.ts";

export const exportDrawers = async (store: DrawerStore): Promise<DrawersFile> =>
  drawersFileOf(await store.list());

/**
 * 가져온 서랍으로 이 기기의 서랍을 모두 바꾼다. 공개 버전은 건드리지 않으므로 손님 화면은
 * 운영자가 다시 공개할 때까지 그대로다(I-11).
 */
export const importDrawers = (store: DrawerStore, drawers: readonly Drawer[]): Promise<void> =>
  store.replaceAll(drawers);

export async function exportRecords(
  events: EventStore,
  handovers: HandoverStore,
  now: string,
): Promise<RecordsFile> {
  return recordsFileOf(await events.list(), await handovers.list(), now);
}
