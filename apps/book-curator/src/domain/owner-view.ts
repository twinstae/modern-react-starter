import type { ShelfBook } from "./book.ts";
import type { Curation } from "./curate.ts";
import type { Drawer, DrawerCode } from "./question-set.ts";
import {
  checkShelfGate,
  MINIMUM_SHELF_KINDS,
  MissingBookError,
  shelfKinds,
  type DrawerStockEntry,
  type ShelfGateResult,
} from "./shelf.ts";

/** 주인 확인에서 보이는 책. 수량은 참고이고 0이어도 목록에서 사라지지 않는다(R-9). */
export interface OwnerBookView {
  readonly bookId: string;
  readonly title: string;
  readonly author: string;
  readonly quantity: number;
}

/** 주인 확인에서 보이는 서랍 하나와 그 안의 책. */
export interface OwnerDrawerView {
  readonly drawer: DrawerCode;
  readonly name: string;
  readonly mark: string | null;
  readonly books: readonly OwnerBookView[];
  readonly kinds: number;
  readonly belowMinimum: boolean;
}

/** 추천·2순위 서랍은 주인에게 보여 줄 상태 문장을 함께 가진다. */
export interface OwnerStatementDrawer extends OwnerDrawerView {
  readonly statement: string;
}

/** 주인 확인 view model. 점수 숫자는 없고, 다른 서랍으로 건넬 수 있게 모든 서랍을 담는다. */
export interface OwnerView {
  readonly recommended: OwnerStatementDrawer;
  readonly second: OwnerStatementDrawer;
  readonly similar: boolean;
  readonly drawers: readonly OwnerDrawerView[];
  readonly gate: ShelfGateResult;
}

/** 손님에게 보이는 서랍 속 책 한 권. 서랍 코드·관련도·점수는 없다(I-9). */
export interface DrawerBookView {
  readonly title: string;
  readonly author: string;
  readonly reason: string;
  readonly question: string;
  readonly quantity: number;
}

const indexBooks = (books: readonly ShelfBook[]): ReadonlyMap<string, ShelfBook> =>
  new Map(books.map((book) => [book.id, book]));

function requireBook(
  books: ReadonlyMap<string, ShelfBook>,
  bookId: string,
  drawer: DrawerCode,
): ShelfBook {
  const book = books.get(bookId);
  if (book === undefined) throw new MissingBookError(bookId, drawer);
  return book;
}

const drawerViews = (
  curation: Curation,
  stock: readonly DrawerStockEntry[],
  books: ReadonlyMap<string, ShelfBook>,
): OwnerDrawerView[] =>
  curation.drawers.map((drawer) => {
    const entries = stock.filter(({ drawer: code }) => code === drawer.code);
    const kinds = shelfKinds(stock, drawer.code);

    return {
      drawer: drawer.code,
      name: drawer.name,
      mark: drawer.mark,
      books: entries.map((entry) => {
        const book = requireBook(books, entry.bookId, drawer.code);
        return {
          bookId: book.id,
          title: book.title,
          author: book.author,
          quantity: entry.quantity,
        };
      }),
      kinds,
      belowMinimum: kinds < MINIMUM_SHELF_KINDS,
    };
  });

const findDrawer = (drawers: readonly OwnerDrawerView[], code: DrawerCode): OwnerDrawerView => {
  const drawer = drawers.find((entry) => entry.drawer === code);
  if (drawer === undefined) throw new Error(`주인 확인에 없는 서랍입니다: ${code}`);
  return drawer;
};

/**
 * 큐레이션 결과에 지금의 서가를 붙여 주인 확인 view model을 만든다.
 * 추천 서랍은 `curation.ranking.first`, 2순위는 `second`이고, 서랍 속 책이 3종 미만이면
 * `belowMinimum`과 `gate.lacking`으로 알린다(I-7). 서랍 이름·표시는 질문 세트에서 온다.
 */
export function ownerView(
  curation: Curation,
  stock: readonly DrawerStockEntry[],
  books: readonly ShelfBook[],
): OwnerView {
  const byId = indexBooks(books);
  const drawers = drawerViews(curation, stock, byId);
  const recommended = findDrawer(drawers, curation.ranking.first);
  const second = findDrawer(drawers, curation.ranking.second);

  return {
    recommended: { ...recommended, statement: curation.statements.recommended },
    second: { ...second, statement: curation.statements.second },
    similar: curation.ranking.similar,
    drawers,
    gate: checkShelfGate(stock, curation.drawers),
  };
}

/**
 * 손님이 열쇠를 받은 서랍의 책만 보여 준다. 수량 0인 책도 "없음"으로 남는다(R-9).
 * 서랍 코드·관련도·다른 서랍의 책·점수는 넣지 않는다(I-9).
 */
export function drawerBooksView(
  drawer: Pick<Drawer, "code">,
  stock: readonly DrawerStockEntry[],
  books: readonly ShelfBook[],
): readonly DrawerBookView[] {
  const byId = indexBooks(books);

  return stock
    .filter((entry) => entry.drawer === drawer.code)
    .map((entry) => {
      const book = requireBook(byId, entry.bookId, drawer.code);
      return {
        title: book.title,
        author: book.author,
        reason: book.reason,
        question: book.question,
        quantity: entry.quantity,
      };
    });
}
