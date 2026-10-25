import { describe, expect, it } from "vite-plus/test";

import { createDrizzleSessionListStore, openDatabase } from "./database.ts";
import { sessions } from "./schema.ts";
import {
  createMemorySessionListStore,
  type SessionListStore,
} from "../domain/session-list-store.ts";

const OLDER = { id: "s-1", title: "첫 모험", createdAt: "2026-10-01T09:00:00Z" };
const NEWER = { id: "s-2", title: "두 번째 모험", createdAt: "2026-10-02T09:00:00Z" };

function describeSessionListStore(name: string, makeStore: () => Promise<SessionListStore>) {
  describe(`세션 목록 저장소 (${name})`, () => {
    it("추가한 세션을 id로 다시 찾는다", async () => {
      const store = await makeStore();
      await store.add(OLDER);

      expect(await store.get(OLDER.id)).toStrictEqual(OLDER);
    });

    it("없는 id는 null이다", async () => {
      const store = await makeStore();

      expect(await store.get("없는-id")).toBeNull();
    });

    it("목록은 최근에 만든 세션부터 나온다", async () => {
      const store = await makeStore();
      await store.add(OLDER);
      await store.add(NEWER);

      expect(await store.list()).toStrictEqual([NEWER, OLDER]);
    });
  });
}

describeSessionListStore("메모리", async () => createMemorySessionListStore());
// PGlite를 띄우고 마이그레이션하는 데 몇 초가 걸리므로 DB는 파일에서 한 번만 열고, 테스트마다 비운다.
const database = openDatabase();
describeSessionListStore("drizzle, PGlite", async () => {
  const db = await database;
  await db.delete(sessions);
  return createDrizzleSessionListStore(db);
});
