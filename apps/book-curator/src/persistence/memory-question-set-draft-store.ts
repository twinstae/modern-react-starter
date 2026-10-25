import type {
  QuestionSetDraft,
  QuestionSetDraftStore,
} from "../application/question-set-draft-ports.ts";
import { parseQuestionSetJson, toQuestionSetJson } from "../domain/question-set.ts";

const copy = (draft: QuestionSetDraft): QuestionSetDraft => ({
  ...draft,
  questionSet: parseQuestionSetJson(toQuestionSetJson(draft.questionSet)),
});

/**
 * 초안을 프로세스 메모리에 둔다. 저장할 때 JSON 경계를 한 번 지나므로, 넘긴 질문 세트가
 * 나중에 바뀌어도 저장한 초안은 그대로다.
 */
export function createMemoryQuestionSetDraftStore(): QuestionSetDraftStore {
  const drafts = new Map<string, QuestionSetDraft>();

  return {
    async list() {
      return [...drafts.values()]
        .sort((left, right) =>
          left.createdAt === right.createdAt
            ? left.id.localeCompare(right.id)
            : left.createdAt.localeCompare(right.createdAt),
        )
        .map(copy);
    },
    async get(id) {
      const draft = drafts.get(id);
      return draft === undefined ? null : copy(draft);
    },
    async create(draft) {
      if (drafts.has(draft.id)) throw new Error(`이미 있는 초안 id입니다: ${draft.id}`);
      drafts.set(draft.id, copy(draft));
    },
    async save(draft) {
      if (!drafts.has(draft.id)) throw new Error(`없는 초안 id입니다: ${draft.id}`);
      drafts.set(draft.id, copy(draft));
    },
  };
}
