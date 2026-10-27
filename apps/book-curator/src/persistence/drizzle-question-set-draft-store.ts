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

export function createDrizzleQuestionSetDraftStore(db: Database): QuestionSetDraftStore {
  return {
    async list() {
      const rows = await db
        .select()
        .from(questionSetDrafts)
        .orderBy(asc(questionSetDrafts.createdAt), asc(questionSetDrafts.id));
      return rows.map(toDomain);
    },
    async get(id) {
      const [row] = await db
        .select()
        .from(questionSetDrafts)
        .where(eq(questionSetDrafts.id, id))
        .limit(1);
      return row === undefined ? null : toDomain(row);
    },
    async create(draft) {
      await db.insert(questionSetDrafts).values(toRow(draft));
    },
    async save(draft) {
      const updated = await db
        .update(questionSetDrafts)
        .set(toRow(draft))
        .where(eq(questionSetDrafts.id, draft.id))
        .returning({ id: questionSetDrafts.id });

      if (updated.length === 0) throw new Error(`없는 초안 id입니다: ${draft.id}`);
    },
  };
}
