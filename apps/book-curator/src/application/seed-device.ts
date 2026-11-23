import type { Drawer } from "../domain/drawer.ts";
import { SEED_DRAWERS } from "../domain/seed-question-set.ts";
import { publish } from "./drawer-admin.ts";
import type { DrawerStore } from "./drawer-ports.ts";
import type { PublishedVersionStore } from "./published-version-ports.ts";

/**
 * 빈 기기를 처음 열면 시드 서랍을 넣고 첫 버전을 공개한다. 그래야 설치하자마자 손님 화면이
 * 돈다. 서랍이 하나라도 있거나 한 번이라도 공개했으면 아무것도 하지 않는다. 운영자가 서랍을
 * 모두 지운 기기에 시드가 다시 생기지 않게 하기 위해서다.
 */
export async function seedEmptyDevice(
  drawers: DrawerStore,
  versions: PublishedVersionStore,
  seed: readonly Drawer[] = SEED_DRAWERS,
): Promise<"seeded" | "kept"> {
  if ((await drawers.list()).length > 0 || (await versions.current()) !== null) return "kept";
  for (const { id, name, questions, books } of seed) {
    await drawers.create({ id, name });
    await drawers.update(id, { questions });
    await drawers.addBooks(id, books);
  }
  await publish(drawers, versions);
  return "seeded";
}
