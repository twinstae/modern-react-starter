import { styled } from "styled-system/jsx";

import type { CustomerCuration } from "../domain/curate.ts";

const Screen = styled("main", {
  base: {
    minH: "100dvh",
    display: "flex",
    flexDirection: "column",
    gap: "6",
    px: "page",
    py: "8",
    bg: "canvas",
    color: "fg.default",
    borderTopWidth: "8px",
    borderTopColor: "yellow.500",
    justifyContent: "center",
    md: { py: "10" },
  },
});

const Statements = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4",
    textAlign: "center",
  },
});

const FirstStatement = styled("h1", {
  base: {
    maxW: "22ch",
    fontFamily: "heading",
    fontSize: "kiosk-result",
    fontWeight: "600",
    lineHeight: "1.28",
    wordBreak: "keep-all",
  },
});

const SecondGroup = styled("div", {
  base: { display: "flex", flexDirection: "column", gap: "1", maxW: "44rem" },
});

const SecondLabel = styled("h2", {
  base: {
    color: "pine.600",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    letterSpacing: "0.08em",
  },
});

const SecondStatement = styled("p", {
  base: {
    fontFamily: "heading",
    fontSize: "kiosk-question",
    lineHeight: "1.4",
    color: "fg.default",
    wordBreak: "keep-all",
  },
});

const SimilarLine = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const Lower = styled("section", {
  base: {
    display: "grid",
    gap: "6",
    width: "full",
    maxW: "64rem",
    mx: "auto",
    alignItems: "stretch",
    lg: {
      gridTemplateColumns: "minmax(0, 1.35fr) minmax(18rem, 0.65fr)",
      alignItems: "center",
    },
  },
});

const DrawerCard = styled("article", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3",
    minW: "0",
    p: "6",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    boxShadow: "zine",
    textAlign: "left",
    md: { p: "8" },
  },
});

const CardEyebrow = styled("p", {
  base: {
    color: "pine.600",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    letterSpacing: "0.08em",
  },
});

const CardHeader = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "2",
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
    fontWeight: "800",
    letterSpacing: "0.02em",
    lineHeight: "1",
  },
});

const Citation = styled("blockquote", {
  base: {
    m: "0",
    pl: "3",
    borderLeftWidth: "4px",
    borderColor: "yellow.500",
    fontFamily: "body",
    fontSize: "kiosk-body",
    lineHeight: "1.55",
    color: "fg.muted",
  },
});

const Reason = styled("p", {
  base: {
    fontFamily: "heading",
    fontSize: "kiosk-body",
    lineHeight: "1.6",
    wordBreak: "keep-all",
  },
});

const Actions = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "3",
    minW: "0",
    textAlign: "center",
  },
});

const OwnerPrompt = styled("p", {
  base: { fontFamily: "body", fontSize: "kiosk-body", fontWeight: "600" },
});

const OwnerButton = styled("button", {
  base: {
    minH: "14",
    px: "6",
    borderWidth: "2px",
    borderColor: "pine.700",
    borderRadius: "l2",
    bg: "pine.600",
    color: "paper.50",
    fontFamily: "body",
    fontSize: "kiosk-body",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "zine",
    transition: "background-color 120ms, color 120ms, translate 120ms, box-shadow 120ms",
    _hover: { bg: "pine.700", borderColor: "pine.700" },
    _active: { translate: "2px 2px", boxShadow: "none" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "3px" },
  },
});

const Notice = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const RetakeButton = styled("button", {
  base: {
    alignSelf: "center",
    borderWidth: "0",
    borderBottomWidth: "1px",
    borderColor: "currentColor",
    bg: "transparent",
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    cursor: "pointer",
    px: "2",
    py: "1",
    _hover: { color: "fg.default" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "3px" },
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
          <SecondLabel>함께 보면 좋은 책</SecondLabel>
          <SecondStatement>{customer.secondStatement}</SecondStatement>
        </SecondGroup>
        {similar ? (
          <SimilarLine>두 서랍이 비슷하게 보여요. 주인과 함께 골라도 좋아요.</SimilarLine>
        ) : null}
      </Statements>
      <Lower>
        <DrawerCard aria-labelledby="recommended-drawer-name">
          <CardEyebrow>큐레이터가 고른 서랍</CardEyebrow>
          <CardHeader>
            <DrawerName id="recommended-drawer-name">{customer.recommendedDrawerName}</DrawerName>
            {customer.recommendedMark === null ? null : (
              <DrawerMark>{customer.recommendedMark}</DrawerMark>
            )}
          </CardHeader>
          <Citation>{customer.citation}</Citation>
          {customer.recommendedReason === null ? null : (
            <Reason>{customer.recommendedReason}</Reason>
          )}
        </DrawerCard>
        <Actions>
          <OwnerPrompt>책방 주인에게 보여 주세요</OwnerPrompt>
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
