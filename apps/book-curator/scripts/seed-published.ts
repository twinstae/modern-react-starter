import { publish } from "../src/application/drawer-admin.ts";
import { SEED_DRAWERS } from "../src/domain/seed-question-set.ts";
import { openConfiguredDatabase } from "../src/persistence/database.ts";
import { createDrizzleDrawerStore } from "../src/persistence/drizzle-drawer-store.ts";
import { createDrizzlePublishedVersionStore } from "../src/persistence/drizzle-published-version-store.ts";

/**
 * 개발·데모용 시드. 서랍이 하나도 없으면 시드 서랍 7개(문항 2개, 예시 책 3권씩)를 만들고,
 * 공개 버전이 없으면 지금 서랍으로 공개한다. 이미 있으면 아무것도 바꾸지 않는다.
 */
const { db, close } = await openConfiguredDatabase();

try {
  const drawers = createDrizzleDrawerStore(db);
  const versions = createDrizzlePublishedVersionStore(db);

  if ((await drawers.list()).length === 0) {
    for (const { id, name, questions, books } of SEED_DRAWERS) {
      await drawers.create({ id, name });
      await drawers.update(id, { questions });
      await drawers.addBooks(id, books);
    }
    console.log(`시드 서랍 ${SEED_DRAWERS.length}개를 만들었습니다.`);
  } else {
    console.log("서랍이 이미 있어 그대로 둡니다.");
  }

  const current = await versions.current();
  if (current === null) {
    const published = await publish(drawers, versions);
    console.log(`공개 버전 ${published.version}을 만들었습니다.`);
  } else {
    console.log(`공개 버전 ${current.version}이 이미 있어 그대로 둡니다.`);
  }
} finally {
  await close();
}
