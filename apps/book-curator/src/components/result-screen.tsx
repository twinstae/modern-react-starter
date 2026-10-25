import { styled } from "styled-system/jsx";

import type { CustomerCuration } from "../domain/curate.ts";

const Screen = styled("main", {
  base: {
    height: "100dvh",
    overflow: "hidden",
    display: "grid",
    gridTemplateRows: "minmax(0, 3fr) minmax(0, 2fr)",
    gap: "4",
    px: "page",
    py: "8",
    bg: "canvas",
    color: "fg.default",
  },
});

const Statements = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "6",
    minH: "0",
    maxW: "5xl",
    mx: "auto",
    textAlign: "center",
  },
});

const FirstStatement = styled("h1", {
  base: {
    fontFamily: "heading",
    fontSize: "kiosk-result",
    fontWeight: "600",
    lineHeight: "1.35",
    wordBreak: "keep-all",
  },
});

const SecondGroup = styled("div", {
  base: { display: "flex", flexDirection: "column", gap: "2" },
});

const SecondLabel = styled("h2", {
  base: {
    color: "seal.500",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "600",
    letterSpacing: "wide",
  },
});

const SecondStatement = styled("p", {
  base: {
    fontFamily: "heading",
    fontSize: "kiosk-question",
    lineHeight: "1.4",
    color: "fg.muted",
    wordBreak: "keep-all",
  },
});

const SimilarLine = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const Lower = styled("section", {
  base: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "1fr auto",
    gap: "4",
    minH: "0",
    width: "full",
    maxW: "6xl",
    mx: "auto",
    lg: { gridTemplateColumns: "1.4fr 1fr", gridTemplateRows: "1fr" },
  },
});

const DrawerCard = styled("article", {
  base: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "3",
    minH: "0",
    px: "6",
    py: "5",
    borderWidth: "1px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.100",
    textAlign: "left",
  },
});

const Eyebrow = styled("p", {
  base: {
    color: "seal.500",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "600",
    letterSpacing: "wide",
  },
});

const CardHeader = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "4",
  },
});

const DrawerName = styled("h2", {
  base: { fontFamily: "heading", fontSize: "kiosk-question", fontWeight: "600" },
});

const DrawerMark = styled("p", {
  base: {
    color: "seal.600",
    fontFamily: "body",
    fontSize: "kiosk-mark",
    fontWeight: "700",
    letterSpacing: "wide",
  },
});

const Reason = styled("p", {
  base: {
    fontFamily: "heading",
    fontSize: "kiosk-body",
    lineHeight: "1.55",
    wordBreak: "keep-all",
  },
});

const Actions = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "3",
    minH: "0",
    textAlign: "center",
  },
});

const OwnerPrompt = styled("p", {
  base: { fontFamily: "heading", fontSize: "kiosk-body", fontWeight: "600" },
});

const OwnerButton = styled("button", {
  base: {
    minH: "14",
    px: "6",
    borderWidth: "0",
    borderRadius: "l2",
    bg: "seal.500",
    color: "white",
    fontFamily: "body",
    fontSize: "kiosk-body",
    fontWeight: "600",
    cursor: "pointer",
    _hover: { bg: "seal.600" },
    _focusVisible: { outline: "2px solid", outlineColor: "ink.900", outlineOffset: "2px" },
  },
});

const Notice = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const RetakeButton = styled("button", {
  base: {
    borderWidth: "0",
    bg: "transparent",
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    textDecoration: "underline",
    cursor: "pointer",
    px: "4",
    py: "2",
    _hover: { color: "fg.default" },
    _focusVisible: { outline: "2px solid", outlineColor: "ink.900", outlineOffset: "2px" },
  },
});

/**
 * 결과 화면. 손님 view model만 받아 상태 문장 두 개와 추천 서랍을 그린다.
 * 점수·서랍 코드·서랍 속 책은 받지도 보여 주지도 않는다(I-9, C-2).
 * 서랍 표시는 사람이 읽는 번호·열쇠 이름이고, 멀리서도 보이게 크게 둔다.
 */
export function ResultScreen({
  customer,
  similar,
  ownerCheckNotice = null,
  onOwnerCheck,
  onRetake,
}: {
  customer: CustomerCuration;
  similar: boolean;
  ownerCheckNotice?: string | null;
  onOwnerCheck: () => void;
  onRetake: () => void;
}) {
  return (
    <Screen aria-label="큐레이션 결과">
      <Statements aria-label="지금 필요한 서랍">
        <FirstStatement>{customer.firstStatement}</FirstStatement>
        <SecondGroup>
          <SecondLabel>함께 필요한</SecondLabel>
          <SecondStatement>{customer.secondStatement}</SecondStatement>
        </SecondGroup>
        {similar ? <SimilarLine>두 서랍의 필요가 비슷하게 겹쳐 있어요</SimilarLine> : null}
      </Statements>
      <Lower>
        <DrawerCard aria-labelledby="recommended-drawer-name">
          <Eyebrow>큐레이터가 권하는 서랍</Eyebrow>
          <CardHeader>
            <DrawerName id="recommended-drawer-name">{customer.recommendedDrawerName}</DrawerName>
            {customer.recommendedMark === null ? null : (
              <DrawerMark>{customer.recommendedMark}</DrawerMark>
            )}
          </CardHeader>
          <Reason>
            {customer.citation}
            {customer.recommendedReason === null ? null : ` ${customer.recommendedReason}`}
          </Reason>
        </DrawerCard>
        <Actions>
          <OwnerPrompt>책방 주인에게 이 화면을 보여 주세요</OwnerPrompt>
          <OwnerButton type="button" onClick={onOwnerCheck}>
            주인 확인
          </OwnerButton>
          {ownerCheckNotice === null ? null : (
            <Notice role="status" aria-label="주인 확인 안내">
              {ownerCheckNotice}
            </Notice>
          )}
          <RetakeButton type="button" onClick={onRetake}>
            다시 해 보기
          </RetakeButton>
        </Actions>
      </Lower>
    </Screen>
  );
}
