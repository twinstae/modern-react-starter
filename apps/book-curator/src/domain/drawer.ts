import * as v from "valibot";

const TextSchema = v.pipe(v.string(), v.trim(), v.minLength(1));

/**
 * 책 한 권을 알아볼 최소한의 정보. 제목과 저자는 있어야 하고 출판사는 비워도 된다.
 * 책은 한 서랍에만 든다. 손님은 실제 서랍을 열어 책을 보므로 앱은 무슨 책인지만 안다.
 */
export const BookInputSchema = v.strictObject({
  title: v.pipe(v.string(), v.trim(), v.minLength(1, "제목을 넣어 주세요")),
  author: v.pipe(v.string(), v.trim(), v.minLength(1, "저자를 넣어 주세요")),
  publisher: v.optional(v.pipe(v.string(), v.trim()), ""),
});

export type BookInput = v.InferOutput<typeof BookInputSchema>;

export const DrawerBookSchema = v.strictObject({
  id: TextSchema,
  ...BookInputSchema.entries,
});

export type DrawerBook = v.InferOutput<typeof DrawerBookSchema>;

/**
 * 서랍. 이름과, 이 서랍이 맞는 손님이라면 "그렇다"고 답할 문항, 서랍에 든 책을 가진다.
 * 손님에게 묻는 질문 세트는 서랍들의 문항을 모은 것이다.
 */
export const DrawerSchema = v.strictObject({
  id: TextSchema,
  name: v.pipe(v.string(), v.trim(), v.minLength(1, "서랍 이름을 넣어 주세요")),
  questions: v.array(v.pipe(v.string(), v.trim(), v.minLength(1, "빈 문항은 둘 수 없어요"))),
  books: v.array(DrawerBookSchema),
});

export type Drawer = v.InferOutput<typeof DrawerSchema>;

export function parseDrawer(value: unknown): Drawer {
  return v.parse(DrawerSchema, value);
}

/** 도메인 값을 평범한 객체로 옮긴다. 배열은 새로 만든다. */
export function toDrawerDto(drawer: Drawer): Drawer {
  return {
    id: drawer.id,
    name: drawer.name,
    questions: [...drawer.questions],
    books: drawer.books.map(({ id, title, author, publisher }) => ({
      id,
      title,
      author,
      publisher,
    })),
  };
}
