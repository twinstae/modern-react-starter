import * as v from "valibot";

import { BookIdSchema } from "./book.ts";
import { DrawerCodeSchema, type Drawer, type DrawerCode } from "./question-set.ts";

/** 서랍마다 수량 1 이상인 책이 이만큼은 있어야 공개하고 열쇠를 건넬 수 있다(I-7). */
export const MINIMUM_SHELF_KINDS = 3;

/** 서랍 하나에 든 책 한 권과 수량. 같은 책을 여러 서랍에 둘 수 있다. */
export const DrawerStockEntrySchema = v.strictObject({
  drawer: DrawerCodeSchema,
  bookId: BookIdSchema,
  quantity: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

export type DrawerStockEntry = v.InferOutput<typeof DrawerStockEntrySchema>;

export const DrawerStockSchema = v.pipe(
  v.array(DrawerStockEntrySchema),
  v.check(
    (entries) =>
      new Set(entries.map(({ drawer, bookId }) => `${drawer}:${bookId}`)).size === entries.length,
    "같은 서랍에 같은 책을 두 번 둘 수 없습니다",
  ),
);

/** 서랍 속 책 목록을 경계에서 파싱한다. */
export function parseDrawerStock(value: unknown): DrawerStockEntry[] {
  return v.parse(DrawerStockSchema, value);
}

export function parseDrawerStockEntry(value: unknown): DrawerStockEntry {
  return v.parse(DrawerStockEntrySchema, value);
}

/** 서랍 하나에 든, 수량 1 이상인 서로 다른 책의 수. 게이트와 경고가 함께 쓴다. */
export function shelfKinds(stock: readonly DrawerStockEntry[], drawer: DrawerCode): number {
  return new Set(
    stock
      .filter((entry) => entry.drawer === drawer && entry.quantity >= 1)
      .map(({ bookId }) => bookId),
  ).size;
}

/** 게이트를 통과하지 못한 서랍. 이름을 함께 돌려 화면이 서랍 코드를 보이지 않게 한다. */
export interface ShelfGateLacking {
  readonly drawer: DrawerCode;
  readonly name: string;
  readonly kinds: number;
}

/** 서가 게이트 결과. 부족한 서랍이 없어야 통과다. */
export interface ShelfGateResult {
  readonly passed: boolean;
  readonly lacking: readonly ShelfGateLacking[];
}

/**
 * 서랍마다 수량 1 이상인 책이 3종 이상인지 본다(I-7).
 * 서랍 이름은 질문 세트에서 받는다. 서가는 이름을 저장하지 않는다.
 */
export function checkShelfGate(
  stock: readonly DrawerStockEntry[],
  drawers: readonly Pick<Drawer, "code" | "name">[],
): ShelfGateResult {
  const lacking = drawers
    .map(({ code, name }) => ({ drawer: code, name, kinds: shelfKinds(stock, code) }))
    .filter(({ kinds }) => kinds < MINIMUM_SHELF_KINDS);

  return { passed: lacking.length === 0, lacking };
}

/** 서랍 속 책이 가리키는 책이 서가에 없을 때 던지는 이름 있는 오류. */
export class MissingBookError extends Error {
  readonly bookId: string;
  readonly drawer: DrawerCode | undefined;

  constructor(bookId: string, drawer?: DrawerCode) {
    super(
      drawer === undefined
        ? `서가에 없는 책입니다: ${bookId}`
        : `서가에 없는 책입니다: ${bookId} (${drawer})`,
    );
    this.name = "MissingBookError";
    this.bookId = bookId;
    this.drawer = drawer;
  }
}
