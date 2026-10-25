import type { QuestionSet } from "../domain/question-set.ts";

/**
 * 아직 공개하지 않은 질문 세트 초안. 공개 버전과 달리 고칠 수 있다.
 * 시각은 애플리케이션이 주입한 ISO 문자열을 그대로 둔다.
 */
export interface QuestionSetDraft {
  readonly id: string;
  readonly name: string;
  readonly questionSet: QuestionSet;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * 질문 세트 초안 저장소. 한 행에 이름과 질문 세트 본문(jsonb)을 통째로 둔다.
 * 공개 버전 저장소와 섞지 않는다(I-11).
 */
export interface QuestionSetDraftStore {
  /** 만든 시각, id 순. */
  list(): Promise<QuestionSetDraft[]>;
  get(id: string): Promise<QuestionSetDraft | null>;
  create(draft: QuestionSetDraft): Promise<void>;
  save(draft: QuestionSetDraft): Promise<void>;
}
