import { styled } from "styled-system/jsx";

import type { Book } from "../domain/book.ts";
import type { DrawerCode } from "../domain/question-set.ts";

export interface BookListDrawer {
  readonly code: DrawerCode;
  readonly name: string;
}

const Wrapper = styled("div", {
  base: {
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    boxShadow: "zine",
    overflowX: "auto",
  },
});

const Table = styled("table", {
  base: {
    width: "full",
    minW: "48rem",
    borderCollapse: "collapse",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    textAlign: "left",
  },
});

const HeadCell = styled("th", {
  base: {
    px: "3",
    py: "3",
    borderBottomWidth: "2px",
    borderColor: "border",
    color: "pine.700",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },
});

const Cell = styled("td", {
  base: {
    px: "3",
    py: "3",
    borderBottomWidth: "1px",
    borderColor: "paper.300",
    verticalAlign: "top",
    overflowWrap: "anywhere",
  },
});

const Title = styled("span", {
  base: { fontFamily: "heading", fontSize: "kiosk-body", fontWeight: "600" },
});

const Quiet = styled("span", { base: { color: "fg.muted" } });

const EditButton = styled("button", {
  base: {
    minH: "10",
    px: "3",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap",
    _hover: { bg: "yellow.100" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "2px" },
  },
});

const Empty = styled("p", {
  base: {
    p: "8",
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "kiosk-body",
    textAlign: "center",
  },
});

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
      <Wrapper>
        <Empty>아직 등록한 책이 없어요. 책 추가로 첫 책을 넣어 주세요.</Empty>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Table>
        <thead>
          <tr>
            <HeadCell scope="col">제목</HeadCell>
            <HeadCell scope="col">저자</HeadCell>
            <HeadCell scope="col">핵심 단어</HeadCell>
            <HeadCell scope="col">관련도 요약</HeadCell>
            <HeadCell scope="col">
              <span aria-hidden="true">고치기</span>
            </HeadCell>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book.id}>
              <Cell>
                <Title>{book.title}</Title>
              </Cell>
              <Cell>{book.author}</Cell>
              <Cell>
                <Quiet>{book.keywords.join(", ")}</Quiet>
              </Cell>
              <Cell>
                <Quiet>{relevanceSummary(book, drawers)}</Quiet>
              </Cell>
              <Cell>
                <EditButton type="button" onClick={() => onEdit(book)}>
                  {book.title} 고치기
                </EditButton>
              </Cell>
            </tr>
          ))}
        </tbody>
      </Table>
    </Wrapper>
  );
}
