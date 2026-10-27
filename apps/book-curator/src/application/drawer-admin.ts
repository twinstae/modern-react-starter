import * as v from "valibot";

import { analyze, type GateIssueCode } from "../domain/analyze.ts";
import { BookInputSchema, DrawerSchema, type BookInput, type Drawer } from "../domain/drawer.ts";
import { snapshotOf } from "../domain/kiosk.ts";
import { questionSetFrom } from "../domain/question-set.ts";
import { seededRng } from "../domain/random.ts";
import type { DrawerStore } from "./drawer-ports.ts";
import type { PublishedVersion, PublishedVersionStore } from "./published-version-ports.ts";

/** 공개 점검 표본의 고정 시드. 같은 서랍이면 늘 같은 점검 결과가 나온다. 79는 책방 이름이다. */
const PUBLISH_CHECK_SEED = 79;

/** 서랍마다 책이 이만큼은 있어야 서비스를 연다(PRD UC-08). 모자라면 공개 전에 경고한다. */
export const MINIMUM_DRAWER_BOOKS = 3;

const NameSchema = DrawerSchema.entries.name;
const QuestionsSchema = DrawerSchema.entries.questions;

export const createDrawer = (store: DrawerStore, name: string, id: string): Promise<Drawer> =>
  store.create({ id, name: v.parse(NameSchema, name) });

export const updateDrawer = (
  store: DrawerStore,
  id: string,
  change: { readonly name?: string; readonly questions?: readonly string[] },
): Promise<Drawer> =>
  store.update(id, {
    ...(change.name === undefined ? {} : { name: v.parse(NameSchema, change.name) }),
    ...(change.questions === undefined
      ? {}
      : { questions: v.parse(QuestionsSchema, change.questions) }),
  });

/** 책을 여러 권 한 번에 넣는다. CSV 업로드가 쓴다. id는 책마다 새로 만든다. */
export const addBooks = (
  store: DrawerStore,
  drawerId: string,
  books: readonly BookInput[],
  newId: () => string,
): Promise<Drawer> =>
  store.addBooks(
    drawerId,
    books.map((book) => ({ id: newId(), ...v.parse(BookInputSchema, book) })),
  );

export const updateBook = (
  store: DrawerStore,
  drawerId: string,
  bookId: string,
  input: BookInput,
): Promise<Drawer> => store.updateBook(drawerId, bookId, v.parse(BookInputSchema, input));

/** 공개를 막거나 알리는 이유 하나. 화면은 코드로 문장을 고르고, 서랍 id로 이름을 붙인다. */
export interface PublishIssue {
  readonly code: GateIssueCode | "too-few-drawers" | "few-books";
  readonly drawers: readonly string[];
}

/** 공개 전 자동 점검. 실패가 없어야 공개할 수 있고, 경고는 알리기만 한다. */
export interface PublishCheck {
  readonly canPublish: boolean;
  readonly failures: readonly PublishIssue[];
  readonly warnings: readonly PublishIssue[];
}

/**
 * 지금 서랍들을 공개해도 되는지 본다. 서랍이 둘 미만이거나 문항 없는 서랍이 있으면
 * 질문 세트를 만들 수 없어 막는다. 쏠림·문항 수 차이·책 부족은 경고다.
 */
export function checkPublish(
  drawers: readonly Drawer[],
  rng: () => number = seededRng(PUBLISH_CHECK_SEED),
): PublishCheck {
  const failures: PublishIssue[] = [];
  const warnings: PublishIssue[] = [];

  if (drawers.length < 2) failures.push({ code: "too-few-drawers", drawers: [] });
  const empty = drawers.filter(({ questions }) => questions.length === 0).map(({ id }) => id);
  if (empty.length > 0) failures.push({ code: "empty-drawer", drawers: empty });

  const fewBooks = drawers
    .filter(({ books }) => books.length < MINIMUM_DRAWER_BOOKS)
    .map(({ id }) => id);
  if (fewBooks.length > 0) warnings.push({ code: "few-books", drawers: fewBooks });

  if (failures.length === 0) {
    const { gate } = analyze(questionSetFrom(drawers), rng);
    failures.push(...gate.failures);
    warnings.push(...gate.warnings);
  }

  return { canPublish: failures.length === 0, failures, warnings };
}

/** 점검을 통과하지 못해 공개하지 않았을 때 던진다. */
export class PublishBlockedError extends Error {
  constructor(readonly check: PublishCheck) {
    super("공개 점검을 통과하지 못했습니다");
    this.name = "PublishBlockedError";
  }
}

/** 지금 서랍·문항·책을 새 공개 버전으로 얼린다. 손님 태블릿은 다음 차례부터 이 버전을 쓴다. */
export async function publish(
  drawers: DrawerStore,
  versions: PublishedVersionStore,
): Promise<PublishedVersion> {
  const current = await drawers.list();
  const check = checkPublish(current);
  if (!check.canPublish) throw new PublishBlockedError(check);
  return versions.publish(snapshotOf(current));
}
