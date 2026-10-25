import { styled } from "styled-system/jsx";

import type { DrawerBookView } from "../domain/owner-view.ts";

/** 화면이 책을 구분해 기록을 부를 수 있도록 서랍 속 책 view에 id만 더한다(I-9). */
export interface DrawerBooksScreenBook extends DrawerBookView {
  readonly bookId: string;
}

const Screen = styled("main", {
  base: {
    minH: "100dvh",
    display: "flex",
    flexDirection: "column",
    gap: "5",
    px: "page",
    py: "8",
    bg: "canvas",
    color: "fg.default",
    textAlign: "left",
  },
});

const Header = styled("header", {
  base: { display: "flex", flexDirection: "column", gap: "1", textAlign: "center" },
});

const Eyebrow = styled("p", {
  base: {
    color: "pine.600",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "800",
    letterSpacing: "0.08em",
  },
});

const TitleRow = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "center",
    gap: "3",
  },
});

const Title = styled("h1", {
  base: {
    fontFamily: "heading",
    fontSize: "kiosk-result",
    fontWeight: "600",
    wordBreak: "keep-all",
  },
});

const Mark = styled("p", {
  base: {
    color: "seal.600",
    fontFamily: "body",
    fontSize: "kiosk-mark",
    fontWeight: "800",
    lineHeight: "1",
  },
});

const BookGrid = styled("section", {
  base: {
    display: "grid",
    gap: "4",
    width: "full",
    maxW: "72rem",
    mx: "auto",
    alignItems: "stretch",
    lg: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
  },
});

const Card = styled("article", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "2",
    minW: "0",
    p: "5",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    boxShadow: "zine",
    textAlign: "left",
  },
});

const CardHead = styled("div", {
  base: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "2",
  },
});

const BookTitle = styled("h2", {
  base: { fontFamily: "heading", fontSize: "1.5rem", fontWeight: "600", wordBreak: "keep-all" },
});

const Author = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const Reason = styled("p", {
  base: { fontFamily: "heading", fontSize: "kiosk-body", lineHeight: "1.6", wordBreak: "keep-all" },
});

const Question = styled("p", {
  base: {
    mt: "auto",
    pt: "2",
    borderTopWidth: "1px",
    borderColor: "paper.300",
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    lineHeight: "1.5",
  },
});

const Quantity = styled("span", {
  base: {
    flexShrink: "0",
    px: "2",
    py: "0.5",
    borderRadius: "l2",
    bg: "paper.100",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
  },
});

const OwnerBox = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "2",
    width: "full",
    maxW: "72rem",
    mx: "auto",
    p: "4",
    borderWidth: "1px",
    borderColor: "seal.500",
    borderRadius: "l2",
    bg: "surface",
  },
});

const OwnerTitle = styled("h2", {
  base: { color: "seal.600", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "800" },
});

const OwnerNote = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const OwnerList = styled("ul", {
  base: {
    display: "grid",
    gap: "2",
    m: "0",
    p: "0",
    listStyle: "none",
    md: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
  },
});

const OwnerRow = styled("li", {
  base: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2" },
});

const RecordButton = styled("button", {
  base: {
    flexShrink: "0",
    minH: "10",
    px: "3",
    borderWidth: "1px",
    borderColor: "pine.600",
    borderRadius: "l2",
    bg: "surface",
    color: "pine.700",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    cursor: "pointer",
    _hover: { bg: "paper.100" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "3px" },
    _disabled: { cursor: "not-allowed", opacity: "0.5" },
  },
});

const Recorded = styled("span", {
  base: { color: "pine.700", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "800" },
});

const Footer = styled("footer", {
  base: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2" },
});

const FinishButton = styled("button", {
  base: {
    minH: "14",
    px: "8",
    borderWidth: "2px",
    borderColor: "pine.700",
    borderRadius: "l2",
    bg: "pine.600",
    color: "paper.50",
    fontFamily: "body",
    fontSize: "kiosk-body",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "zine",
    _hover: { bg: "pine.700" },
    _active: { translate: "2px 2px", boxShadow: "none" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "3px" },
  },
});

const Notice = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

/**
 * 열쇠를 받은 손님에게 그 서랍의 책만 보여 준다. 책마다 제목·저자·권하는 이유·함께
 * 생각해 볼 질문을 같은 무게로 두고, 수량 0은 "없음"으로 남긴다(R-9, I-9).
 * 주인용 산 책 기록은 작게 두고, 주인 토큰이 없으면 누를 수 없다(I-15).
 */
export function DrawerBooksScreen({
  drawer,
  books,
  canRecordPurchase,
  recordedBookId = null,
  notice = null,
  onPurchase,
  onFinish,
}: {
  drawer: { readonly name: string; readonly mark: string | null };
  books: readonly DrawerBooksScreenBook[];
  canRecordPurchase: boolean;
  recordedBookId?: string | null;
  notice?: string | null;
  onPurchase: (bookId: string) => void;
  onFinish: () => void;
}) {
  return (
    <Screen aria-label="서랍 속 책 안내">
      <Header>
        <Eyebrow>열쇠를 받았어요</Eyebrow>
        <TitleRow>
          <Title>{drawer.name}</Title>
          {drawer.mark === null ? null : <Mark>{drawer.mark}</Mark>}
        </TitleRow>
      </Header>

      <BookGrid aria-label="서랍 속 책">
        {books.length === 0 ? (
          <Card>
            <BookTitle>아직 이 서랍이 비어 있어요</BookTitle>
            <Reason>책방 주인에게 말씀해 주세요.</Reason>
          </Card>
        ) : (
          books.map((book) => (
            <Card key={book.bookId}>
              <CardHead>
                <BookTitle>{book.title}</BookTitle>
                <Quantity aria-label={`${book.title} 수량`}>
                  {book.quantity === 0 ? "없음" : `${book.quantity}권`}
                </Quantity>
              </CardHead>
              <Author>{book.author}</Author>
              <Reason>{book.reason}</Reason>
              <Question>{book.question}</Question>
            </Card>
          ))
        )}
      </BookGrid>

      <OwnerBox aria-label="산 책 기록">
        <OwnerTitle>산 책 기록 · 주인만</OwnerTitle>
        <OwnerNote>산 책이 있으면 작게 기록해 주세요. 수량이 함께 줄어요.</OwnerNote>
        {notice === null ? null : (
          <Notice role="status" aria-label="산 책 기록 안내">
            {notice}
          </Notice>
        )}
        <OwnerList>
          {books.map((book) => {
            const recorded = recordedBookId === book.bookId;
            return (
              <OwnerRow key={book.bookId}>
                <span>
                  {book.title}
                  {recorded ? <Recorded role="status"> · 기록했어요</Recorded> : null}
                </span>
                <RecordButton
                  type="button"
                  aria-label={`${book.title} 이 책 기록`}
                  disabled={!canRecordPurchase || book.quantity === 0}
                  onClick={() => onPurchase(book.bookId)}
                >
                  이 책 기록
                </RecordButton>
              </OwnerRow>
            );
          })}
        </OwnerList>
      </OwnerBox>

      <Footer>
        <FinishButton type="button" onClick={onFinish}>
          처음으로
        </FinishButton>
      </Footer>
    </Screen>
  );
}
