import { styled } from "styled-system/jsx";

import type { OwnerBookView, OwnerDrawerView, OwnerView } from "../domain/owner-view.ts";
import type { DrawerCode } from "../domain/question-set.ts";
import {
  BodyText,
  Button,
  Card,
  CardTitle,
  Eyebrow,
  MarkText,
  MutedText,
  PageTitle,
  ReasonText,
  Screen,
  SectionTitle,
  WarningText,
} from "../ui/index.ts";

const OwnerScreen = styled(Screen, {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "1",
    px: "page",
    py: "2",
    textAlign: "left",
  },
});

const Header = styled("header", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "3",
  },
});

const HeaderText = styled("div", {
  base: { display: "flex", flexDirection: "column", gap: "1" },
});

const OwnerLabel = styled("p", {
  base: {
    display: "inline-flex",
    alignSelf: "flex-start",
    px: "2",
    py: "0.5",
    borderWidth: "2px",
    borderColor: "seal.500",
    borderRadius: "l2",
    color: "seal.600",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "800",
    letterSpacing: "0.08em",
  },
});

const Layout = styled("div", {
  base: {
    display: "grid",
    gap: "3",
    alignItems: "start",
    lg: { gridTemplateColumns: "minmax(0, 1.25fr) minmax(18rem, 0.75fr)" },
  },
});

const Side = styled("div", {
  base: { display: "flex", flexDirection: "column", gap: "3", minW: "0" },
});

const DrawerHead = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "2",
  },
});

const BookList = styled("ul", {
  base: { display: "flex", flexDirection: "column", gap: "1", m: "0", p: "0", listStyle: "none" },
});

const BookLine = styled("li", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "2",
    borderBottomWidth: "1px",
    borderColor: "paper.300",
    py: "1",
    fontFamily: "body",
    fontSize: "kiosk-caption",
  },
});

const BookTitle = styled("span", { base: { fontWeight: "600", wordBreak: "keep-all" } });
const BookMeta = styled("span", { base: { color: "fg.muted" } });

const Quantity = styled("span", {
  base: {
    flexShrink: "0",
    px: "2",
    borderRadius: "l2",
    bg: "paper.100",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
  },
});

const Others = styled("section", {
  base: { display: "flex", flexDirection: "column", gap: "2" },
});

const OtherList = styled("div", {
  base: { display: "grid", gap: "2", md: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" } },
});

const OtherDetails = styled("details", {
  base: { borderTopWidth: "1px", borderColor: "paper.300", pt: "2" },
});

const OtherSummary = styled("summary", {
  base: {
    cursor: "pointer",
    color: "pine.700",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "2px" },
  },
});

const Notice = styled("p", {
  base: {
    p: "3",
    borderWidth: "2px",
    borderColor: "pine.500",
    borderRadius: "l2",
    bg: "surface",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
  },
});

const quantityLabel = (quantity: number): string => (quantity === 0 ? "없음" : `${quantity}권`);

function OwnerBookList({ books }: { books: readonly OwnerBookView[] }) {
  if (books.length === 0) {
    return <MutedText>아직 이 서랍에 책이 없어요.</MutedText>;
  }

  return (
    <BookList>
      {books.map((book) => (
        <BookLine key={book.bookId}>
          <span>
            <BookTitle>{book.title}</BookTitle> <BookMeta>{book.author}</BookMeta>
          </span>
          <Quantity aria-label={`${book.title} 수량`}>{quantityLabel(book.quantity)}</Quantity>
        </BookLine>
      ))}
    </BookList>
  );
}

function BelowMinimum({ drawer }: { drawer: OwnerDrawerView }) {
  if (!drawer.belowMinimum) return null;
  return (
    <WarningText role="status">
      3종이 안 돼요. 지금 {drawer.kinds}종이에요. 책을 더 채우면 열쇠를 건넬 수 있어요.
    </WarningText>
  );
}

/**
 * 주인 확인. 손님 결과와 달리 빨간 seal 테두리와 "주인 모드" 표시로 화면이 다르다.
 * 추천 서랍을 크게 두고, 2순위·비슷함·3종 미만 경고·모든 서랍의 책과 수량을 보여 준다.
 * 주인은 추천과 다른 서랍을 골라 열쇠를 건넬 수 있다(R-7). 서랍 코드는 화면에 쓰지 않는다.
 */
export function OwnerCheckScreen({
  view,
  notice = null,
  onHandover,
  onCancel,
}: {
  view: OwnerView;
  notice?: string | null;
  onHandover: (drawer: DrawerCode) => void;
  onCancel: () => void;
}) {
  const others = view.drawers.filter(
    ({ drawer }) => drawer !== view.recommended.drawer && drawer !== view.second.drawer,
  );

  return (
    <OwnerScreen tone="owner" aria-label="주인 확인">
      <Header>
        <HeaderText>
          <OwnerLabel>주인 모드</OwnerLabel>
          <PageTitle fontSize="1.6rem">열쇠를 건넬 서랍을 골라 주세요</PageTitle>
        </HeaderText>
        <Button tone="link" onClick={onCancel}>
          손님 화면으로
        </Button>
      </Header>

      {notice === null ? null : (
        <Notice role="status" aria-label="주인 확인 안내">
          {notice}
        </Notice>
      )}

      <Layout>
        <Card tone="owner" gap="2" p="3" aria-labelledby="owner-recommended-name">
          <Eyebrow>추천 서랍</Eyebrow>
          <DrawerHead>
            <CardTitle id="owner-recommended-name">{view.recommended.name}</CardTitle>
            {view.recommended.mark === null ? null : <MarkText>{view.recommended.mark}</MarkText>}
          </DrawerHead>
          <ReasonText>{view.recommended.statement}</ReasonText>
          <OwnerBookList books={view.recommended.books} />
          <BelowMinimum drawer={view.recommended} />
          <Button
            type="button"
            tone="owner"
            size="lg"
            fullWidth
            onClick={() => onHandover(view.recommended.drawer)}
          >
            이 서랍 열쇠 건넴
          </Button>
        </Card>

        <Side>
          <Card tone="flat" p="3" aria-labelledby="owner-second-name">
            <Eyebrow>2순위 서랍</Eyebrow>
            <DrawerHead>
              <SectionTitle id="owner-second-name">{view.second.name}</SectionTitle>
              {view.second.mark === null ? null : (
                <MarkText fontSize="1.25rem">{view.second.mark}</MarkText>
              )}
            </DrawerHead>
            <BodyText>{view.second.statement}</BodyText>
            <OwnerBookList books={view.second.books} />
            <BelowMinimum drawer={view.second} />
            <Button
              type="button"
              tone="outline"
              alignSelf="flex-start"
              onClick={() => onHandover(view.second.drawer)}
            >
              {view.second.name} 열쇠 건넴
            </Button>
          </Card>

          {view.similar ? (
            <MutedText>두 서랍이 비슷하게 보여요. 손님과 함께 골라도 좋아요.</MutedText>
          ) : null}

          {view.gate.passed ? null : (
            <WarningText role="status" aria-label="서가 게이트">
              아직 채우지 못한 서랍이 있어요: {view.gate.lacking.map(({ name }) => name).join(", ")}
            </WarningText>
          )}
        </Side>
      </Layout>

      {others.length === 0 ? null : (
        <Others aria-label="다른 서랍">
          <Eyebrow>다른 서랍</Eyebrow>
          <OtherList>
            {others.map((drawer) => (
              <Card key={drawer.drawer} tone="flat" padding="sm">
                <DrawerHead>
                  <SectionTitle>{drawer.name}</SectionTitle>
                  {drawer.mark === null ? null : (
                    <MarkText fontSize="1.25rem">{drawer.mark}</MarkText>
                  )}
                </DrawerHead>
                <BelowMinimum drawer={drawer} />
                <OtherDetails>
                  <OtherSummary>
                    책 {drawer.books.length}종 ·{" "}
                    {drawer.books.reduce((sum, book) => sum + book.quantity, 0)}권 보기
                  </OtherSummary>
                  <OwnerBookList books={drawer.books} />
                </OtherDetails>
                <Button
                  type="button"
                  tone="outline"
                  alignSelf="flex-start"
                  onClick={() => onHandover(drawer.drawer)}
                >
                  {drawer.name} 열쇠 건넴
                </Button>
              </Card>
            ))}
          </OtherList>
        </Others>
      )}
    </OwnerScreen>
  );
}
