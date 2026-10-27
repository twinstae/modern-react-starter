import type { Book } from "../domain/book.ts";
import type { DrawerCode } from "../domain/question-set.ts";
import { Button, Card, InlineText, MutedText, Table, Td, Th } from "../ui/index.ts";

export interface BookListDrawer {
  readonly code: DrawerCode;
  readonly name: string;
}

/** 관련도가 높은 서랍 두 곳만 서랍 이름으로 요약한다. 코드는 화면에 내보내지 않는다. */
function relevanceSummary(book: Book, drawers: readonly BookListDrawer[]): string {
  const named = drawers
    .map((drawer) => ({ name: drawer.name, value: book.relevance[drawer.code] }))
    .filter(({ value }) => value > 0)
    .sort((a, b) => b.value - a.value);

  if (named.length === 0) return "—";
  return named
    .slice(0, 2)
    .map(({ name, value }) => `${name} ${value}`)
    .join(" · ");
}

/**
 * 운영자 서가의 책 표. 책이 없으면 다음 행동을 안내한다.
 * 관련도는 서랍 이름으로만 요약하고, 고치기는 행마다 하나씩 둔다.
 */
export function BookList({
  books,
  drawers,
  onEdit,
}: {
  books: readonly Book[];
  drawers: readonly BookListDrawer[];
  onEdit: (book: Book) => void;
}) {
  if (books.length === 0) {
    return (
      <Card tone="paper" p="0" overflowX="auto">
        <MutedText fontSize="kiosk-body" p="8" textAlign="center">
          아직 등록한 책이 없어요. 책 추가로 첫 책을 넣어 주세요.
        </MutedText>
      </Card>
    );
  }

  return (
    <Card tone="paper" p="0" overflowX="auto">
      <Table>
        <thead>
          <tr>
            <Th scope="col">제목</Th>
            <Th scope="col">저자</Th>
            <Th scope="col">핵심 단어</Th>
            <Th scope="col">관련도 요약</Th>
            <Th scope="col">
              <span aria-hidden="true">고치기</span>
            </Th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id}>
              <Td>
                <InlineText fontFamily="heading" fontSize="kiosk-body" weight="normal">
                  {book.title}
                </InlineText>
              </Td>
              <Td>{book.author}</Td>
              <Td>
                <InlineText tone="muted">{book.keywords.join(", ")}</InlineText>
              </Td>
              <Td>
                <InlineText tone="muted">{relevanceSummary(book, drawers)}</InlineText>
              </Td>
              <Td>
                <Button tone="outline" size="sm" onClick={() => onEdit(book)}>
                  {book.title} 고치기
                </Button>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
