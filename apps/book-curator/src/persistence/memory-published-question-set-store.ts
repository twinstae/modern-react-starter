import type {
  PublishedQuestionSet,
  PublishedQuestionSetStore,
} from "../application/published-question-set-ports.ts";
import {
  parseQuestionSetJson,
  toQuestionSetJson,
  type QuestionSet,
} from "../domain/question-set.ts";

/**
 * 공개 버전을 프로세스 메모리에 둔다. 저장할 때 JSON 경계를 한 번 지나므로, 넘긴 값이
 * 나중에 바뀌어도 이미 공개한 버전은 그대로 남는다.
 */
export function createMemoryPublishedQuestionSetStore(): PublishedQuestionSetStore {
  const versions = new Map<number, PublishedQuestionSet>();
  let currentVersion: number | null = null;

  const copy = (version: number, questionSet: QuestionSet): PublishedQuestionSet => ({
    version,
    questionSet: parseQuestionSetJson(toQuestionSetJson(questionSet)),
  });

  return {
    async list() {
      return [...versions.values()].sort((a, b) => a.version - b.version);
    },
    async get(version) {
      return versions.get(version) ?? null;
    },
    async current() {
      return currentVersion === null ? null : (versions.get(currentVersion) ?? null);
    },
    async publish(questionSet) {
      const maxVersion = Math.max(0, ...versions.keys());
      const published = copy(maxVersion + 1, questionSet);
      versions.set(published.version, published);
      currentVersion = published.version;
      return published;
    },
  };
}
