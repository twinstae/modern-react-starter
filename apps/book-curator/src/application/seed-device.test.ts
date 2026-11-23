import { describe, expect, it } from "vite-plus/test";

import { SEED_DRAWERS } from "../domain/seed-question-set.ts";
import { createMemoryDrawerStore } from "../persistence/memory-drawer-store.ts";
import { createMemoryPublishedVersionStore } from "../persistence/memory-published-version-store.ts";
import { createDrawer, publish, updateDrawer } from "./drawer-admin.ts";
import { currentKioskBundle } from "./kiosk-bundle.ts";
import { seedEmptyDevice } from "./seed-device.ts";

describe("빈 기기의 첫 실행", () => {
  it("시드 서랍을 넣고 버전 1을 공개해, 손님 화면이 바로 돈다", async () => {
    const drawers = createMemoryDrawerStore();
    const versions = createMemoryPublishedVersionStore();

    expect(await seedEmptyDevice(drawers, versions)).toBe("seeded");

    expect(await drawers.list()).toStrictEqual(SEED_DRAWERS);
    const bundle = await currentKioskBundle(versions);
    expect(bundle.status === "ready" ? bundle.version : null).toBe(1);
  });

  it("다시 열어도 시드를 또 넣지 않는다", async () => {
    const drawers = createMemoryDrawerStore();
    const versions = createMemoryPublishedVersionStore();
    await seedEmptyDevice(drawers, versions);

    expect(await seedEmptyDevice(drawers, versions)).toBe("kept");

    expect(await drawers.list()).toHaveLength(SEED_DRAWERS.length);
    expect(await versions.list()).toHaveLength(1);
  });

  it("운영자가 서랍을 모두 지웠어도 공개한 적이 있으면 시드를 넣지 않는다", async () => {
    const drawers = createMemoryDrawerStore();
    const versions = createMemoryPublishedVersionStore();
    await seedEmptyDevice(drawers, versions);
    for (const { id } of await drawers.list()) await drawers.remove(id);

    expect(await seedEmptyDevice(drawers, versions)).toBe("kept");
    expect(await drawers.list()).toStrictEqual([]);
  });
});

describe("손님이 받는 묶음", () => {
  it("공개 버전이 없으면 준비 중이다", async () => {
    expect(await currentKioskBundle(createMemoryPublishedVersionStore())).toStrictEqual({
      status: "preparing",
    });
  });

  it("공개한 뒤 서랍을 고쳐도 다시 공개하기 전까지 손님은 그 버전을 받는다(I-11)", async () => {
    const drawers = createMemoryDrawerStore();
    const versions = createMemoryPublishedVersionStore();
    for (const id of ["a", "b"]) {
      await createDrawer(drawers, `${id} 서랍`, id);
      await updateDrawer(drawers, id, { questions: [`${id} 문항`] });
    }
    await publish(drawers, versions);
    await updateDrawer(drawers, "a", { name: "고친 서랍" });

    const bundle = await currentKioskBundle(versions);
    expect(bundle.status === "ready" ? bundle.questionSet.drawers : null).toStrictEqual([
      { id: "a", name: "a 서랍" },
      { id: "b", name: "b 서랍" },
    ]);
  });
});
