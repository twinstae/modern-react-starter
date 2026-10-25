import { styled } from "styled-system/jsx";

import type { DrawerBookView } from "../domain/owner-view.ts";
import {
  Button,
  Caption,
  Card,
  CardTitle,
  Eyebrow,
  MarkText,
  MutedText,
  PageTitle,
  ReasonText,
  Screen,
} from "../ui/index.ts";

/** 화면이 책을 구분해 기록을 부를 수 있도록 서랍 속 책 view에 id만 더한다(I-9). */
export interface DrawerBooksScreenBook extends DrawerBookView {
  readonly bookId: string;
}

const DrawerScreen = styled(Screen, {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "5",
    px: "page",
    py: "8",
    textAlign: "left",
  },
});

const Header = styled("header", {
  base: { display: "flex", flexDirection: "column", gap: "1", textAlign: "center" },
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

const BookGrid = styled("section", {
  base: {
    display: "grid",
    gap: "4",
    width: "full",
    maxW: "72rem",
    mx: "auto",
    alignItems: "stretch",
    md: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
    lg: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
  },
});

const CardHead = styled("div", {
  base: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "2" },
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

const OwnerList = styled("ul", {
  base: {
    display: "grid",
    gap: "2",
    m: "0",
    p: "0",
    listStyle: "none",
    md: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
    lg: { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
  },
});

const OwnerRow = styled("li", {
  base: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2" },
});

const Recorded = styled("span", {
  base: { color: "pine.700", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "800" },
});

const Footer = styled("footer", {
  base: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2" },
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
  recordedBookIds = [],
  notice = null,
  onPurchase,
  onFinish,
}: {
  drawer: { readonly name: string; readonly mark: string | null };
  books: readonly DrawerBooksScreenBook[];
  canRecordPurchase: boolean;
  recordedBookIds?: readonly string[];
  notice?: string | null;
  onPurchase: (bookId: string) => void;
  onFinish: () => void;
}) {
  return (
    <DrawerScreen tone="customer" aria-label="서랍 속 책 안내">
      <Header>
        <Eyebrow>열쇠를 받았어요</Eyebrow>
        <TitleRow>
          <PageTitle>{drawer.name}</PageTitle>
          {drawer.mark === null ? null : <MarkText>{drawer.mark}</MarkText>}
        </TitleRow>
      </Header>

      <BookGrid aria-label="서랍 속 책">
        {books.length === 0 ? (
          <Card tone="paper">
            <CardTitle>아직 이 서랍이 비어 있어요</CardTitle>
            <MutedText>책방 주인에게 말씀해 주세요.</MutedText>
          </Card>
        ) : (
          books.map((book) => (
            <Card key={book.bookId} tone="paper">
              <CardHead>
                <CardTitle>{book.title}</CardTitle>
                <Quantity aria-label={`${book.title} 수량`}>
                  {book.quantity === 0 ? "없음" : `${book.quantity}권`}
                </Quantity>
              </CardHead>
              <MutedText>{book.author}</MutedText>
              <ReasonText>{book.reason}</ReasonText>
              <Caption color="fg.muted">{book.question}</Caption>
            </Card>
          ))
        )}
      </BookGrid>

      <Card tone="flat" aria-label="산 책 기록">
        <Eyebrow tone="seal">산 책 기록 · 주인만</Eyebrow>
        <MutedText>산 책이 있으면 작게 기록해 주세요. 수량이 함께 줄어요.</MutedText>
        {notice === null ? null : (
          <MutedText role="status" aria-label="산 책 기록 안내">
            {notice}
          </MutedText>
        )}
        <OwnerList>
          {books.map((book) => {
            const recorded = recordedBookIds.includes(book.bookId);
            return (
              <OwnerRow key={book.bookId}>
                <span>
                  {book.title}
                  {recorded ? <Recorded role="status"> · 기록했어요</Recorded> : null}
                </span>
                <Button
                  tone="outline"
                  size="sm"
                  aria-label={`${book.title} 이 책 기록`}
                  disabled={!canRecordPurchase || book.quantity === 0}
                  onClick={() => onPurchase(book.bookId)}
                >
                  이 책 기록
                </Button>
              </OwnerRow>
            );
          })}
        </OwnerList>
      </Card>

      <Footer>
        <Button type="button" size="lg" onClick={onFinish}>
          처음으로
        </Button>
      </Footer>
    </DrawerScreen>
  );
}
