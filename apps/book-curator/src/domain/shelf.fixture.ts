import { parseBook, type Book, type BookRelevance } from "./book.ts";
import type { DrawerCode } from "./question-set.ts";
import { parseDrawerStock, type DrawerStockEntry } from "./shelf.ts";

const relevanceFor = (main: DrawerCode): BookRelevance => ({
  B1: main === "B1" ? 5 : 1,
  B2: main === "B2" ? 5 : 1,
  B3: main === "B3" ? 5 : 1,
  B4: main === "B4" ? 5 : 1,
  B5: main === "B5" ? 5 : 1,
  B6: main === "B6" ? 5 : 1,
  B7: main === "B7" ? 5 : 1,
});

const book = (
  id: string,
  title: string,
  author: string,
  main: DrawerCode,
  keywords: readonly string[],
): Book =>
  parseBook({
    id,
    title,
    author,
    relevance: relevanceFor(main),
    keywords,
    reason: `${title}을(를) 지금 건네고 싶은 이유`,
    question: `${title}을(를) 읽으며 함께 생각해 볼 질문`,
  });

/**
 * 서가 예시. B6는 세 종류가 있어 게이트를 통과하고, B1은 두 종류 중 하나가 수량 0이라
 * 한 종류만 남아 게이트에 걸린다. B2도 한 종류뿐이다.
 */
export const SHELF_BOOKS: readonly Book[] = [
  book("book-b6-1", "삶을 바꾸는 연습", "김연습", "B6", ["삶", "연습"]),
  book("book-b6-2", "하루의 구조", "박구조", "B6", ["하루", "구조"]),
  book("book-b6-3", "작은 실험", "이실험", "B6", ["실험", "작음"]),
  book("book-b1-1", "나를 보는 시간", "정보기", "B1", ["나", "시간"]),
  book("book-b1-2", "마음의 지도", "한마음", "B1", ["마음", "지도"]),
  book("book-b2-1", "관계의 거리", "최거리", "B2", ["관계", "거리"]),
];

export const SHELF_STOCK: readonly DrawerStockEntry[] = parseDrawerStock([
  { drawer: "B6", bookId: "book-b6-1", quantity: 2 },
  { drawer: "B6", bookId: "book-b6-2", quantity: 1 },
  { drawer: "B6", bookId: "book-b6-3", quantity: 1 },
  { drawer: "B1", bookId: "book-b1-1", quantity: 1 },
  { drawer: "B1", bookId: "book-b1-2", quantity: 0 },
  { drawer: "B2", bookId: "book-b2-1", quantity: 1 },
]);
