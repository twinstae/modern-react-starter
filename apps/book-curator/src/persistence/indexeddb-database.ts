import { openDB, type DBSchema, type IDBPDatabase } from "idb";

/**
 * 태블릿 한 대의 IndexedDB. 값은 도메인 DTO 그대로 넣고, 읽을 때 다시 파싱한다(경계).
 * 넣은 순서가 곧 읽는 순서인 저장소는 자동 증가 키(`seq`)로 순서를 지킨다.
 */
export interface DeviceSchema extends DBSchema {
  drawers: { key: number; value: { seq?: number; drawer: unknown }; indexes: { id: string } };
  publishedVersions: { key: number; value: { version: number; snapshot: unknown } };
  events: {
    key: number;
    value: { seq?: number; sessionId: string; event: unknown };
    indexes: { sessionId: string };
  };
  handovers: {
    key: number;
    value: { id?: number; sessionId: string; record: unknown };
    indexes: { sessionId: string };
  };
  access: { key: "owner" | "admin"; value: unknown };
}

export type DeviceDatabase = IDBPDatabase<DeviceSchema>;

export const DEVICE_DATABASE_NAME = "book-curator";

/** 기기 DB를 연다. 처음 열면 표를 만든다. 테스트는 저마다 다른 이름을 넘긴다. */
export function openDeviceDatabase(name: string = DEVICE_DATABASE_NAME): Promise<DeviceDatabase> {
  return openDB<DeviceSchema>(name, 1, {
    upgrade(db) {
      db.createObjectStore("drawers", { keyPath: "seq", autoIncrement: true }).createIndex(
        "id",
        "drawer.id",
        { unique: true },
      );
      db.createObjectStore("publishedVersions", { keyPath: "version" });
      db.createObjectStore("events", { keyPath: "seq", autoIncrement: true }).createIndex(
        "sessionId",
        "sessionId",
      );
      db.createObjectStore("handovers", { keyPath: "id", autoIncrement: true }).createIndex(
        "sessionId",
        "sessionId",
      );
      db.createObjectStore("access");
    },
  });
}
