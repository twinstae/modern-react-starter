import { asc, eq } from "drizzle-orm";

import type {
  QuestionSetDraft,
  QuestionSetDraftStore,
} from "../application/question-set-draft-ports.ts";
import { parseQuestionSet, toQuestionSetDto } from "../domain/question-set.ts";
import type { Database } from "./database.ts";
import { questionSetDrafts } from "./schema.ts";

type DraftRow = {
  readonly id: string;
  readonly name: string;
  readonly questionSet: ReturnType<typeof toQuestionSetDto>;
  readonly createdAt: string;
  readonly updatedAt: string;
};

const toDomain = (row: DraftRow): QuestionSetDraft => ({
  id: row.id,
  name: row.name,
  questionSet: parseQuestionSet(row.questionSet),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const toRow = (draft: QuestionSetDraft) => ({
  id: draft.id,
  name: draft.name,
  questionSet: toQuestionSetDto(draft.questionSet),
  createdAt: draft.createdAt,
  updatedAt: draft.updatedAt,
});

/**
 * PGlite/Postgres 질문 세트 초안 저장소. 라우트가 DB를 비동기로 열 수 있도록 완성된 DB와
 * 그 DB의 약속을 모두 받는다.
 */
export function createDrizzleQuestionSetDraftStore(
  dbSource: Database | Promise<Database>,
): QuestionSetDraftStore {
  let opened: Promise<Database> | undefined;
  const database = (): Promise<Database> => (opened ??= Promise.resolve(dbSource));

  return {
    async list() {
      const db = await database();
      const rows = await db
        .select()
        .from(questionSetDrafts)
        .orderBy(asc(questionSetDrafts.createdAt), asc(questionSetDrafts.id));
      return rows.map(toDomain);
    },
    async get(id) {
      const db = await database();
      const [row] = await db
        .select()
        .from(questionSetDrafts)
        .where(eq(questionSetDrafts.id, id))
        .limit(1);
      return row === undefined ? null : toDomain(row);
    },
    async create(draft) {
      const db = await database();
      await db.insert(questionSetDrafts).values(toRow(draft));
    },
    async save(draft) {
      const db = await database();
      const updated = await db
        .update(questionSetDrafts)
        .set(toRow(draft))
        .where(eq(questionSetDrafts.id, draft.id))
        .returning({ id: questionSetDrafts.id });

      if (updated.length === 0) throw new Error(`없는 초안 id입니다: ${draft.id}`);
    },
  };
}
