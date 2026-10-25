import { beforeEach, describe, expect, it } from "vite-plus/test";

import type { PublishedQuestionSetStore } from "../application/published-question-set-ports.ts";
import {
  parseQuestionSet,
  toQuestionSetDto,
  type QuestionSet,
} from "../domain/question-set.ts";
import { SEED_QUESTION_SET } from "../domain/seed-question-set.ts";

const changedFirstQuestion = (set: QuestionSet): QuestionSet =>
  parseQuestionSet({
    ...toQuestionSetDto(set),
    questions: set.questions.map((question, index) =>
      index === 0 && question.type === "item"
        ? { ...question, text: "[가정] 두 번째 버전의 첫 문항" }
        : question,
    ),
  });

/**
 * 메모리와 PGlite 구현이 함께 통과하는 공개 버전 저장소 계약.
 * `setup`은 매 테스트마다 빈 저장소를 새로 준다.
 */
export function publishedQuestionSetStoreContract(
  name: string,
  setup: () => Promise<PublishedQuestionSetStore>,
): void {
  describe(`${name} 공개 버전 저장소 계약`, () => {
    let store: PublishedQuestionSetStore;

    beforeEach(async () => {
      store = await setup();
    });

    it("공개 버전이 없으면 목록과 현재 버전이 비어 있다", async () => {
      expect(await store.list()).toStrictEqual([]);
      expect(await store.current()).toBeNull();
      expect(await store.get(1)).toBeNull();
    });

    it("공개하면 1번 버전을 만들고 현재 버전으로 가리킨다", async () => {
      const published = await store.publish(SEED_QUESTION_SET);

      expect(published.version).toBe(1);
      expect(published.questionSet).toStrictEqual(SEED_QUESTION_SET);
      expect(await store.list()).toStrictEqual([published]);
      expect(await store.get(1)).toStrictEqual(published);
      expect(await store.current()).toStrictEqual(published);
    });

    it("다시 공개하면 2번 버전을 더하고 1번 행은 그대로 둔다(I-11)", async () => {
      const first = await store.publish(SEED_QUESTION_SET);
      const second = await store.publish(changedFirstQuestion(SEED_QUESTION_SET));

      expect(second.version).toBe(2);
      expect(await store.list()).toStrictEqual([first, second]);
      expect(await store.get(1)).toStrictEqual(first);
      expect((await store.get(1))?.questionSet).toStrictEqual(SEED_QUESTION_SET);
      expect(await store.current()).toStrictEqual(second);
    });

    it("버전 번호는 지금까지의 최대값 다음이다", async () => {
      await store.publish(SEED_QUESTION_SET);
      await store.publish(changedFirstQuestion(SEED_QUESTION_SET));

      expect((await store.publish(SEED_QUESTION_SET)).version).toBe(3);
      expect((await store.list()).map(({ version }) => version)).toStrictEqual([1, 2, 3]);
    });
  });
}
