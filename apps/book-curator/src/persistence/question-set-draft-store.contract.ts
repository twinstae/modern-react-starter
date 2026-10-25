import { beforeEach, describe, expect, it } from "vite-plus/test";

import type {
  QuestionSetDraft,
  QuestionSetDraftStore,
} from "../application/question-set-draft-ports.ts";
import { parseQuestionSet, toQuestionSetDto } from "../domain/question-set.ts";
import { SEED_QUESTION_SET } from "../domain/seed-question-set.ts";

const draft = (id: string, name: string, updatedAt: string): QuestionSetDraft => ({
  id,
  name,
  questionSet: SEED_QUESTION_SET,
  createdAt: "2026-10-25T00:00:00.000Z",
  updatedAt,
});

/**
 * 메모리와 PGlite 구현이 함께 통과하는 질문 세트 초안 저장소 계약.
 * `setup`은 매 테스트마다 빈 저장소를 새로 준다.
 */
export function questionSetDraftStoreContract(
  name: string,
  setup: () => Promise<QuestionSetDraftStore>,
): void {
  describe(`${name} 질문 세트 초안 저장소 계약`, () => {
    let store: QuestionSetDraftStore;

    beforeEach(async () => {
      store = await setup();
    });

    it("초안이 없으면 목록과 단건이 비어 있다", async () => {
      expect(await store.list()).toStrictEqual([]);
      expect(await store.get("draft-none")).toBeNull();
    });

    it("초안을 만들면 만든 시각·id 순으로 읽히고, 저장한 값을 그대로 돌려준다", async () => {
      const first = draft("draft-1", "첫 초안", "2026-10-25T00:00:00.000Z");
      const second = draft("draft-2", "둘째 초안", "2026-10-25T01:00:00.000Z");

      await store.create(second);
      await store.create(first);

      expect(await store.list()).toStrictEqual([first, second]);
      expect(await store.get(first.id)).toStrictEqual(first);
    });

    it("초안을 저장하면 같은 id로 덮어쓰고 만든 시각은 그대로다", async () => {
      const created = draft("draft-1", "첫 초안", "2026-10-25T00:00:00.000Z");
      await store.create(created);
      const changed: QuestionSetDraft = {
        ...created,
        name: "고친 초안",
        questionSet: parseQuestionSet({
          ...toQuestionSetDto(SEED_QUESTION_SET),
          statementTemplate: "{nickname} 님에게 {drawer}이/가 필요해요",
        }),
        updatedAt: "2026-10-25T02:00:00.000Z",
      };

      await store.save(changed);

      expect(await store.get(created.id)).toStrictEqual(changed);
      expect((await store.list())[0]?.createdAt).toBe(created.createdAt);
    });

    it("없는 초안은 저장하지 않는다", async () => {
      await expect(
        store.save(draft("draft-none", "없는 초안", "2026-10-25T00:00:00.000Z")),
      ).rejects.toThrow();
    });
  });
}
