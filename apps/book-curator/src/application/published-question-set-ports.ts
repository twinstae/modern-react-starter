import type { QuestionSet } from "../domain/question-set.ts";

/** 공개된 질문 세트 한 버전. 한 번 공개한 뒤에는 고치지 않는다(I-11). */
export interface PublishedQuestionSet {
  readonly version: number;
  readonly questionSet: QuestionSet;
}

/**
 * 공개 버전 저장소. `publish`는 지금까지의 최대 버전 + 1로 새 행을 만들고 공개 중
 * 포인터만 옮긴다. 이전 버전 행은 건드리지 않는다(I-11).
 */
export interface PublishedQuestionSetStore {
  /** 버전 오름차순. */
  list(): Promise<PublishedQuestionSet[]>;
  get(version: number): Promise<PublishedQuestionSet | null>;
  current(): Promise<PublishedQuestionSet | null>;
  publish(questionSet: QuestionSet): Promise<PublishedQuestionSet>;
}
