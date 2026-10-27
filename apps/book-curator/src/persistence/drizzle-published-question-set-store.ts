import { eq, sql } from "drizzle-orm";

import type {
  PublishedQuestionSet,
  PublishedQuestionSetStore,
} from "../application/published-question-set-ports.ts";
import { parseQuestionSet, toQuestionSetDto } from "../domain/question-set.ts";
import type { Database } from "./database.ts";
import { publishedQuestionSets, publishedQuestionSetPointer } from "./schema.ts";

const CURRENT_POINTER_ID = "current";

type PublishedRow = {
  readonly version: number;
  readonly questionSet: ReturnType<typeof toQuestionSetDto>;
};

const toDomain = (row: PublishedRow): PublishedQuestionSet => ({
  version: row.version,
  questionSet: parseQuestionSet(row.questionSet),
});

export function createDrizzlePublishedQuestionSetStore(db: Database): PublishedQuestionSetStore {
  return {
    async list() {
      const rows = await db
        .select()
        .from(publishedQuestionSets)
        .orderBy(publishedQuestionSets.version);
      return rows.map(toDomain);
    },
    async get(version) {
      const [row] = await db
        .select()
        .from(publishedQuestionSets)
        .where(eq(publishedQuestionSets.version, version))
        .limit(1);
      return row === undefined ? null : toDomain(row);
    },
    async current() {
      const [row] = await db
        .select({
          version: publishedQuestionSets.version,
          questionSet: publishedQuestionSets.questionSet,
        })
        .from(publishedQuestionSetPointer)
        .innerJoin(
          publishedQuestionSets,
          eq(publishedQuestionSetPointer.version, publishedQuestionSets.version),
        )
        .where(eq(publishedQuestionSetPointer.id, CURRENT_POINTER_ID))
        .limit(1);
      return row === undefined ? null : toDomain(row);
    },
    async publish(questionSet) {
      const dto = toQuestionSetDto(questionSet);

      return db.transaction(async (tx) => {
        const [maxRow] = await tx
          .select({ version: sql<number | null>`max(${publishedQuestionSets.version})` })
          .from(publishedQuestionSets);
        const version = Number(maxRow?.version ?? 0) + 1;

        await tx.insert(publishedQuestionSets).values({ version, questionSet: dto });
        await tx
          .insert(publishedQuestionSetPointer)
          .values({ id: CURRENT_POINTER_ID, version })
          .onConflictDoUpdate({
            target: publishedQuestionSetPointer.id,
            set: { version },
          });

        return { version, questionSet: parseQuestionSet(dto) };
      });
    },
  };
}
