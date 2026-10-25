import { mkdir } from "node:fs/promises";

import { createDrizzlePublishedQuestionSetStore } from "../src/persistence/drizzle-published-question-set-store.ts";
import { openDatabase } from "../src/persistence/database.ts";
import { SEED_QUESTION_SET } from "../src/domain/seed-question-set.ts";

/**
 * 개발·데모용 공개 버전 시드. 공개 중인 버전이 없을 때만 시드 질문 세트를 1번으로
 * 공개한다. 다시 돌려도 새 버전을 만들지 않는다.
 */
const DATA_DIR = ".data/pglite";

await mkdir(DATA_DIR, { recursive: true });
const db = await openDatabase(DATA_DIR);

try {
  const store = createDrizzlePublishedQuestionSetStore(db);
  const current = await store.current();

  if (current === null) {
    const published = await store.publish(SEED_QUESTION_SET);
    console.log(`공개 버전 ${published.version}을 시드 질문 세트로 만들었습니다.`);
  } else {
    console.log(`이미 공개 버전 ${current.version}이 있어 그대로 둡니다.`);
  }
} finally {
  await db.$client.close();
}
