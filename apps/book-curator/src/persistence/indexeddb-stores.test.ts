import "fake-indexeddb/auto";

import { describe, expect, it } from "vite-plus/test";

import { sampleFunnelEvents } from "../domain/funnel.fixture.ts";
import { snapshotOf } from "../domain/kiosk.ts";
import { SEED_DRAWERS } from "../domain/seed-question-set.ts";
import { adminAccessStoreContract } from "./admin-access-store.contract.ts";
import { drawerStoreContract } from "./drawer-store.contract.ts";
import { eventStoreContract } from "./event-store.contract.ts";
import { openDeviceDatabase } from "./indexeddb-database.ts";
import {
  createIndexedDbAdminAccessStore,
  createIndexedDbDrawerStore,
  createIndexedDbEventStore,
  createIndexedDbHandoverStore,
  createIndexedDbOwnerAccessStore,
  createIndexedDbPublishedVersionStore,
} from "./indexeddb-stores.ts";
import { ownerAccessStoreContract } from "./owner-access-store.contract.ts";
import { ownerRecordStoreContract } from "./owner-record-store.contract.ts";
import { publishedVersionStoreContract } from "./published-version-store.contract.ts";

// 테스트마다 이름이 다른 DB를 열어, 앞 테스트의 행이 남지 않는다.
const freshDatabase = () => openDeviceDatabase(`test-${crypto.randomUUID()}`);

drawerStoreContract("IndexedDB", async () => createIndexedDbDrawerStore(await freshDatabase()));

publishedVersionStoreContract("IndexedDB", async () =>
  createIndexedDbPublishedVersionStore(await freshDatabase()),
);

eventStoreContract("IndexedDB", async () => createIndexedDbEventStore(await freshDatabase()));

ownerRecordStoreContract("IndexedDB", async () => ({
  handovers: createIndexedDbHandoverStore(await freshDatabase()),
}));

adminAccessStoreContract("IndexedDB", async () =>
  createIndexedDbAdminAccessStore(await freshDatabase()),
);

describe("IndexedDB 주인 잠금 저장소", () => {
  ownerAccessStoreContract(async () => createIndexedDbOwnerAccessStore(await freshDatabase()));
});

describe("IndexedDB 기기 DB", () => {
  it("DB를 닫고 다시 열어도 모든 저장소의 값이 남는다", async () => {
    const name = `test-${crypto.randomUUID()}`;
    const events = sampleFunnelEvents("session-reopen");
    const handover = { sessionId: "session-reopen", version: 1, recommended: "B6", handed: "B1" };

    const first = await openDeviceDatabase(name);
    const drawers = createIndexedDbDrawerStore(first);
    await drawers.create({ id: "a", name: "가 서랍" });
    await drawers.addBooks("a", [{ id: "1", title: "첫 책", author: "저자", publisher: "" }]);
    await createIndexedDbPublishedVersionStore(first).publish(snapshotOf(SEED_DRAWERS));
    await createIndexedDbEventStore(first).append(events);
    await createIndexedDbHandoverStore(first).append(handover);
    first.close();

    const second = await openDeviceDatabase(name);
    expect(await createIndexedDbDrawerStore(second).list()).toStrictEqual([
      {
        id: "a",
        name: "가 서랍",
        questions: [],
        books: [{ id: "1", title: "첫 책", author: "저자", publisher: "" }],
      },
    ]);
    expect((await createIndexedDbPublishedVersionStore(second).current())?.version).toBe(1);
    expect(await createIndexedDbEventStore(second).list()).toStrictEqual(events);
    expect(await createIndexedDbHandoverStore(second).list()).toStrictEqual([
      { id: 1, ...handover },
    ]);
    second.close();
  });

  it("문항을 빈 문장으로 고치려 하면 서랍이 그대로 남는다", async () => {
    const store = createIndexedDbDrawerStore(await freshDatabase());
    await store.create({ id: "a", name: "가 서랍" });
    await store.update("a", { questions: ["첫 문항"] });

    await expect(store.update("a", { questions: [" "] })).rejects.toThrow();

    expect(await store.list()).toStrictEqual([
      { id: "a", name: "가 서랍", questions: ["첫 문항"], books: [] },
    ]);
  });
});
