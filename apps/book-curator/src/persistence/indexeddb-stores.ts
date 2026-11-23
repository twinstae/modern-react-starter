import {
  BookNotFoundError,
  DrawerNotFoundError,
  type DrawerStore,
} from "../application/drawer-ports.ts";
import type { EventStore } from "../application/event-store-ports.ts";
import type { HandoverStore } from "../application/owner-record-ports.ts";
import type {
  PublishedVersion,
  PublishedVersionStore,
} from "../application/published-version-ports.ts";
import { parseDrawer, toDrawerDto, type Drawer } from "../domain/drawer.ts";
import { parseFunnelEvent, toFunnelEventDto } from "../domain/funnel.ts";
import { parsePublishedSnapshot, toPublishedSnapshotDto } from "../domain/kiosk.ts";
import {
  parseHandoverInput,
  parseHandoverRecord,
  toHandoverRecordDto,
} from "../domain/owner-record.ts";
import type { DeviceDatabase } from "./indexeddb-database.ts";

/** 서랍은 만든 순서(`seq`)로 두고, 고칠 때도 같은 `seq`에 덮어써 순서가 바뀌지 않는다. */
export function createIndexedDbDrawerStore(db: DeviceDatabase): DrawerStore {
  /** 한 트랜잭션 안에서 서랍을 읽고 고친다. 고친 값이 스키마를 어기면 아무것도 쓰지 않는다. */
  const change = async (id: string, edit: (drawer: Drawer) => Drawer): Promise<Drawer> => {
    const tx = db.transaction("drawers", "readwrite");
    const index = tx.store.index("id");
    const seq = await index.getKey(id);
    const row = seq === undefined ? undefined : await tx.store.get(seq);
    // 아직 아무것도 쓰지 않았으므로, 여기서 던지면 트랜잭션은 바뀐 것 없이 끝난다.
    if (seq === undefined || row === undefined) throw new DrawerNotFoundError(id);
    const next = parseDrawer(toDrawerDto(edit(parseDrawer(row.drawer))));
    await tx.store.put({ seq, drawer: toDrawerDto(next) });
    await tx.done;
    return toDrawerDto(next);
  };

  const requireBook = (drawer: Drawer, bookId: string) => {
    if (!drawer.books.some(({ id }) => id === bookId)) throw new BookNotFoundError(bookId);
  };

  return {
    async list() {
      const rows = await db.getAll("drawers");
      return rows.map((row) => toDrawerDto(parseDrawer(row.drawer)));
    },
    async create({ id, name }) {
      const drawer = parseDrawer({ id, name, questions: [], books: [] });
      await db.add("drawers", { drawer: toDrawerDto(drawer) });
      return toDrawerDto(drawer);
    },
    update: (id, { name, questions }) =>
      change(id, (drawer) => ({
        ...drawer,
        name: name ?? drawer.name,
        questions: questions === undefined ? drawer.questions : [...questions],
      })),
    async remove(id) {
      const tx = db.transaction("drawers", "readwrite");
      const seq = await tx.store.index("id").getKey(id);
      if (seq === undefined) throw new DrawerNotFoundError(id);
      await tx.store.delete(seq);
      await tx.done;
    },
    addBooks: (drawerId, books) =>
      change(drawerId, (drawer) => ({ ...drawer, books: [...drawer.books, ...books] })),
    updateBook: (drawerId, bookId, input) =>
      change(drawerId, (drawer) => {
        requireBook(drawer, bookId);
        return {
          ...drawer,
          books: drawer.books.map((book) => (book.id === bookId ? { id: bookId, ...input } : book)),
        };
      }),
    removeBook: (drawerId, bookId) =>
      change(drawerId, (drawer) => {
        requireBook(drawer, bookId);
        return { ...drawer, books: drawer.books.filter(({ id }) => id !== bookId) };
      }),
  };
}

/** 공개 버전은 버전 번호가 키다. 한 번 넣은 행은 고치지 않는다(I-11). */
export function createIndexedDbPublishedVersionStore(db: DeviceDatabase): PublishedVersionStore {
  const toVersion = (row: { version: number; snapshot: unknown }): PublishedVersion => ({
    version: row.version,
    ...parsePublishedSnapshot(row.snapshot),
  });

  return {
    async list() {
      return (await db.getAll("publishedVersions")).map(toVersion);
    },
    async current() {
      const cursor = await db.transaction("publishedVersions").store.openCursor(null, "prev");
      return cursor === null ? null : toVersion(cursor.value);
    },
    async publish(snapshot) {
      const dto = toPublishedSnapshotDto(parsePublishedSnapshot(toPublishedSnapshotDto(snapshot)));
      const tx = db.transaction("publishedVersions", "readwrite");
      const last = await tx.store.openCursor(null, "prev");
      const version = (last?.value.version ?? 0) + 1;
      await tx.store.add({ version, snapshot: dto });
      await tx.done;
      return { version, ...parsePublishedSnapshot(dto) };
    },
  };
}

/** 이벤트는 추가 전용이다. 넣을 때 파싱해, 틀린 이벤트가 하나라도 있으면 묶음 전체를 넣지 않는다. */
export function createIndexedDbEventStore(db: DeviceDatabase): EventStore {
  return {
    async append(batch) {
      if (batch.length === 0) return;
      const rows = batch.map((event) => {
        const parsed = parseFunnelEvent(toFunnelEventDto(event));
        return { sessionId: parsed.sessionId, event: toFunnelEventDto(parsed) };
      });
      const tx = db.transaction("events", "readwrite");
      await Promise.all([...rows.map((row) => tx.store.add(row)), tx.done]);
    },
    async list(sessionId) {
      const rows =
        sessionId === undefined
          ? await db.getAll("events")
          : await db.getAllFromIndex("events", "sessionId", sessionId);
      return rows.map((row) => parseFunnelEvent(row.event));
    },
  };
}

/** 열쇠 건넴 기록. id는 IndexedDB의 자동 증가 키다. */
export function createIndexedDbHandoverStore(db: DeviceDatabase): HandoverStore {
  const toRecord = (row: { id?: number; record: unknown }) =>
    toHandoverRecordDto(parseHandoverRecord({ ...parseHandoverInput(row.record), id: row.id }));

  return {
    async append(input) {
      const parsed = parseHandoverInput(input);
      const record = {
        sessionId: parsed.sessionId,
        version: parsed.version,
        recommended: parsed.recommended,
        handed: parsed.handed,
      };
      const id = await db.add("handovers", { sessionId: parsed.sessionId, record });
      return toRecord({ id, record });
    },
    async list(sessionId) {
      const rows =
        sessionId === undefined
          ? await db.getAll("handovers")
          : await db.getAllFromIndex("handovers", "sessionId", sessionId);
      return rows.map(toRecord);
    },
  };
}
