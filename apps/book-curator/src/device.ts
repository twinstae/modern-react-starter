import { seedEmptyDevice } from "./application/seed-device.ts";
import { openDeviceDatabase, type DeviceDatabase } from "./persistence/indexeddb-database.ts";
import {
  createIndexedDbAdminAccessStore,
  createIndexedDbDrawerStore,
  createIndexedDbEventStore,
  createIndexedDbHandoverStore,
  createIndexedDbOwnerAccessStore,
  createIndexedDbPublishedVersionStore,
} from "./persistence/indexeddb-stores.ts";

/** 태블릿 한 대의 저장소들. 서버 없이 이 기기의 IndexedDB에만 있다(ADR 0006). */
export function createDeviceStores(db: DeviceDatabase) {
  return {
    drawers: createIndexedDbDrawerStore(db),
    versions: createIndexedDbPublishedVersionStore(db),
    events: createIndexedDbEventStore(db),
    handovers: createIndexedDbHandoverStore(db),
    ownerAccess: createIndexedDbOwnerAccessStore(db),
    adminAccess: createIndexedDbAdminAccessStore(db),
  };
}

export type DeviceStores = ReturnType<typeof createDeviceStores>;

let opening: Promise<DeviceStores> | null = null;

/**
 * 기기 저장소를 한 번만 연다. 처음 열 때 빈 기기면 시드 서랍을 공개하고, 브라우저가
 * 저장 공간이 모자랄 때 이 앱의 데이터를 지우지 않도록 영구 저장을 요청한다.
 * 열다 실패하면 다음 호출이 다시 연다.
 */
export function device(): Promise<DeviceStores> {
  opening ??= (async () => {
    const stores = createDeviceStores(await openDeviceDatabase());
    await seedEmptyDevice(stores.drawers, stores.versions);
    void navigator.storage?.persist?.().catch(() => false);
    return stores;
  })().catch((error: unknown) => {
    opening = null;
    throw error;
  });
  return opening;
}
