import { SEED_QUESTION_SET } from "../src/domain/seed-question-set.ts";
import { toQuestionSetDto } from "../src/domain/question-set.ts";
import { openConfiguredDatabase } from "../src/persistence/database.ts";
import { createDrizzlePublishedQuestionSetStore } from "../src/persistence/drizzle-published-question-set-store.ts";

/**
 * 개발·데모용 공개 버전 시드. 공개 중인 버전이 없거나, 시드 질문 세트의 내용이
 * 달라졌을 때만 새 버전을 공개한다. 같은 내용을 다시 돌리면 아무것도 만들지 않는다.
 * 공개 버전은 고치지 않으므로(I-11), 시드가 바뀌면 새 버전 번호가 붙는다.
 */
const sameQuestionSet = (left: unknown, right: unknown) =>
  JSON.stringify(left) === JSON.stringify(right);

const { db, close } = await openConfiguredDatabase();

try {
  const store = createDrizzlePublishedQuestionSetStore(db);
  const current = await store.current();
  const seed = toQuestionSetDto(SEED_QUESTION_SET);

  if (current === null) {
    const published = await store.publish(SEED_QUESTION_SET);
    console.log(`공개 버전 ${published.version}을 시드 질문 세트로 만들었습니다.`);
  } else if (!sameQuestionSet(toQuestionSetDto(current.questionSet), seed)) {
    const published = await store.publish(SEED_QUESTION_SET);
    console.log(
      `시드 내용이 바뀌어 공개 버전 ${published.version}을 새로 만들었습니다. (이전 ${current.version})`,
    );
  } else {
    console.log(`이미 같은 내용의 공개 버전 ${current.version}이 있어 그대로 둡니다.`);
  }
} finally {
  await close();
}
