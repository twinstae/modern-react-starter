import { styled } from "styled-system/jsx";

import type { DrawerCode } from "../domain/question-set.ts";
import type { OwnerBookView, OwnerDrawerView, OwnerView } from "../domain/owner-view.ts";

const Screen = styled("main", {
  base: {
    minH: "100dvh",
    display: "flex",
    flexDirection: "column",
    gap: "3",
    px: "page",
    py: "4",
    bg: "canvas",
    color: "fg.default",
    borderTopWidth: "8px",
    borderTopColor: "seal.500",
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

const Title = styled("h1", {
  base: { fontFamily: "heading", fontSize: "1.6rem", fontWeight: "600", lineHeight: "1.25" },
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

const Layout = styled("div", {
  base: {
    display: "grid",
    gap: "3",
    alignItems: "start",
    lg: { gridTemplateColumns: "minmax(0, 1.25fr) minmax(18rem, 0.75fr)" },
  },
});

const Recommended = styled("article", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "2",
    p: "4",
    borderWidth: "3px",
    borderColor: "seal.500",
    borderRadius: "l2",
    bg: "surface",
    boxShadow: "zine",
  },
});

const Side = styled("div", {
  base: { display: "flex", flexDirection: "column", gap: "3", minW: "0" },
});

const Card = styled("article", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "2",
    p: "3",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
  },
});

const Eyebrow = styled("p", {
  base: {
    color: "pine.600",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "800",
    letterSpacing: "0.06em",
  },
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

const DrawerName = styled("h2", {
  base: { fontFamily: "heading", fontSize: "1.75rem", fontWeight: "600", wordBreak: "keep-all" },
});

const DrawerNameSmall = styled("h3", {
  base: { fontFamily: "heading", fontSize: "1.25rem", fontWeight: "600", wordBreak: "keep-all" },
});

const DrawerMark = styled("p", {
  base: {
    color: "seal.600",
    fontFamily: "body",
    fontSize: "kiosk-mark",
    fontWeight: "800",
    lineHeight: "1",
  },
});

const DrawerMarkSmall = styled("p", {
  base: {
    color: "seal.600",
    fontFamily: "body",
    fontSize: "1.25rem",
    fontWeight: "800",
    lineHeight: "1",
  },
});

const Statement = styled("p", {
  base: {
    fontFamily: "heading",
    fontSize: "kiosk-body",
    lineHeight: "1.55",
    wordBreak: "keep-all",
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

const BookTitle = styled("span", {
  base: { fontWeight: "600", wordBreak: "keep-all" },
});

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

const Warning = styled("p", {
  base: { color: "seal.600", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "700" },
});

const SimilarLine = styled("p", {
  base: {
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    lineHeight: "1.3",
  },
});

const Others = styled("section", {
  base: { display: "flex", flexDirection: "column", gap: "2" },
});

const OthersTitle = styled("h2", {
  base: { fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "800", color: "pine.600" },
});

const OtherList = styled("div", {
  base: { display: "grid", gap: "2", md: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" } },
});

const OtherCard = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "2",
    p: "2",
    borderWidth: "1px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
  },
});

const PrimaryButton = styled("button", {
  base: {
    minH: "14",
    px: "5",
    borderWidth: "2px",
    borderColor: "seal.600",
    borderRadius: "l2",
    bg: "seal.500",
    color: "paper.50",
    fontFamily: "body",
    fontSize: "kiosk-body",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "zine",
    _hover: { bg: "seal.600" },
    _active: { translate: "2px 2px", boxShadow: "none" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "3px" },
  },
});

const DrawerButton = styled("button", {
  base: {
    alignSelf: "flex-start",
    minH: "12",
    px: "4",
    borderWidth: "2px",
    borderColor: "pine.600",
    borderRadius: "l2",
    bg: "surface",
    color: "pine.700",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "800",
    cursor: "pointer",
    _hover: { bg: "pine.500", color: "paper.50" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "3px" },
  },
});

const CancelButton = styled("button", {
  base: {
    minH: "12",
    px: "4",
    borderWidth: "0",
    borderBottomWidth: "1px",
    borderColor: "currentColor",
    bg: "transparent",
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    cursor: "pointer",
    _hover: { color: "fg.default" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "3px" },
  },
});

const quantityLabel = (quantity: number): string => (quantity === 0 ? "없음" : `${quantity}권`);

function OwnerBookList({ books }: { books: readonly OwnerBookView[] }) {
  if (books.length === 0) {
    return <BookLine as="p">아직 이 서랍에 책이 없어요.</BookLine>;
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
    <Warning role="status">
      3종이 안 돼요. 지금 {drawer.kinds}종이에요. 책을 더 채우면 열쇠를 건넬 수 있어요.
    </Warning>
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
    <Screen aria-label="주인 확인">
      <Header>
        <HeaderText>
          <OwnerLabel>주인 모드</OwnerLabel>
          <Title>열쇠를 건넬 서랍을 골라 주세요</Title>
        </HeaderText>
        <CancelButton type="button" onClick={onCancel}>
          손님 화면으로
        </CancelButton>
      </Header>

      {notice === null ? null : (
        <Notice role="status" aria-label="주인 확인 안내">
          {notice}
        </Notice>
      )}

      <Layout>
        <Recommended aria-labelledby="owner-recommended-name">
          <Eyebrow>추천 서랍</Eyebrow>
          <DrawerHead>
            <DrawerName id="owner-recommended-name">{view.recommended.name}</DrawerName>
            {view.recommended.mark === null ? null : (
              <DrawerMark>{view.recommended.mark}</DrawerMark>
            )}
          </DrawerHead>
          <Statement>{view.recommended.statement}</Statement>
          <OwnerBookList books={view.recommended.books} />
          <BelowMinimum drawer={view.recommended} />
          <PrimaryButton type="button" onClick={() => onHandover(view.recommended.drawer)}>
            이 서랍 열쇠 건넴
          </PrimaryButton>
        </Recommended>

        <Side>
          <Card aria-labelledby="owner-second-name">
            <Eyebrow>2순위 서랍</Eyebrow>
            <DrawerHead>
              <DrawerNameSmall id="owner-second-name">{view.second.name}</DrawerNameSmall>
              {view.second.mark === null ? null : (
                <DrawerMarkSmall>{view.second.mark}</DrawerMarkSmall>
              )}
            </DrawerHead>
            <Statement>{view.second.statement}</Statement>
            <OwnerBookList books={view.second.books} />
            <BelowMinimum drawer={view.second} />
            <DrawerButton type="button" onClick={() => onHandover(view.second.drawer)}>
              {view.second.name} 열쇠 건넴
            </DrawerButton>
          </Card>

          {view.similar ? (
            <SimilarLine>두 서랍이 비슷하게 보여요. 손님과 함께 골라도 좋아요.</SimilarLine>
          ) : null}

          {view.gate.passed ? null : (
            <Warning role="status" aria-label="서가 게이트">
              아직 채우지 못한 서랍이 있어요: {view.gate.lacking.map(({ name }) => name).join(", ")}
            </Warning>
          )}
        </Side>
      </Layout>

      {others.length === 0 ? null : (
        <Others aria-label="다른 서랍">
          <OthersTitle>다른 서랍</OthersTitle>
          <OtherList>
            {others.map((drawer) => (
              <OtherCard key={drawer.drawer}>
                <DrawerHead>
                  <DrawerNameSmall>{drawer.name}</DrawerNameSmall>
                  {drawer.mark === null ? null : <DrawerMarkSmall>{drawer.mark}</DrawerMarkSmall>}
                </DrawerHead>
                <OwnerBookList books={drawer.books} />
                <BelowMinimum drawer={drawer} />
                <DrawerButton type="button" onClick={() => onHandover(drawer.drawer)}>
                  {drawer.name} 열쇠 건넴
                </DrawerButton>
              </OtherCard>
            ))}
          </OtherList>
        </Others>
      )}
    </Screen>
  );
}
