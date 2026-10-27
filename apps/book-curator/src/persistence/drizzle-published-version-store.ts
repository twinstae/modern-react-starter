import { asc, desc, sql } from "drizzle-orm";

import type {
  PublishedVersion,
  PublishedVersionStore,
} from "../application/published-version-ports.ts";
import { parsePublishedSnapshot, toPublishedSnapshotDto } from "../domain/kiosk.ts";
import type { Database } from "./database.ts";
import { publishedQuestionSets, publishedVersions } from "./schema.ts";

const toDomain = (row: { version: number; snapshot: unknown }): PublishedVersion => ({
  version: row.version,
  ...parsePublishedSnapshot(row.snapshot),
});

/**
 * 공개 버전을 Postgres에 둔다. 새 버전 번호는 예전 `published_question_sets`의 번호까지
 * 함께 보고 그 뒤를 잇는다. 이벤트에 남은 예전 버전 번호와 겹치지 않게 하기 위해서다(I-16).
 */
export function createDrizzlePublishedVersionStore(db: Database): PublishedVersionStore {
  return {
    async list() {
      const rows = await db
        .select()
        .from(publishedVersions)
        .orderBy(asc(publishedVersions.version));
      return rows.map(toDomain);
    },
    async current() {
      const [row] = await db
        .select()
        .from(publishedVersions)
        .orderBy(desc(publishedVersions.version))
        .limit(1);
      return row === undefined ? null : toDomain(row);
    },
    async publish(snapshot) {
      const dto = toPublishedSnapshotDto(snapshot);
      return db.transaction(async (tx) => {
        const maxOf = sql<number | null>`max(version)`;
        const [latest] = await tx.select({ version: maxOf }).from(publishedVersions);
        const [legacy] = await tx.select({ version: maxOf }).from(publishedQuestionSets);
        const version = Math.max(Number(latest?.version ?? 0), Number(legacy?.version ?? 0)) + 1;
        await tx.insert(publishedVersions).values({ version, snapshot: dto });
        return { version, ...parsePublishedSnapshot(dto) };
      });
    },
  };
}
