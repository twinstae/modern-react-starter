import { styled } from "styled-system/jsx";

import type { CustomerCuration } from "../domain/curate.ts";
import {
  BodyText,
  Button,
  Card,
  CardTitle,
  Eyebrow,
  MarkText,
  MutedText,
  ReasonText,
  ResultTitle,
  Screen,
  SecondaryTitle,
  StatusText,
} from "../ui/index.ts";

const Statements = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4",
    textAlign: "center",
  },
});

const SecondGroup = styled("div", {
  base: { display: "flex", flexDirection: "column", gap: "1", maxW: "44rem" },
});

const SecondLabel = styled("h2", {
  base: {
    color: "seal.600",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    letterSpacing: "0.08em",
  },
});

const SimilarLine = styled(MutedText, { base: { textAlign: "center" } });

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

const CardHeader = styled("div", {
  base: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "2",
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

const OwnerPrompt = styled(BodyText, { base: { fontWeight: "600" } });

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
    <Screen
      display="flex"
      flexDirection="column"
      justifyContent="center"
      gap="6"
      px="page"
      py="8"
      md={{ py: "10" }}
    >
      <Statements aria-label="지금 필요한 서랍">
        <ResultTitle>{customer.firstStatement}</ResultTitle>
        <SecondGroup>
          <SecondLabel>함께 보면 좋은 책</SecondLabel>
          <SecondaryTitle>{customer.secondStatement}</SecondaryTitle>
        </SecondGroup>
        {similar ? (
          <SimilarLine>두 서랍이 비슷하게 보여요. 주인과 함께 골라도 좋아요.</SimilarLine>
        ) : null}
      </Statements>
      <Lower>
        <Card tone="paper" aria-labelledby="recommended-drawer-name">
          <Eyebrow>큐레이터가 고른 서랍</Eyebrow>
          <CardHeader>
            <CardTitle id="recommended-drawer-name">{customer.recommendedDrawerName}</CardTitle>
            {customer.recommendedMark === null ? null : (
              <MarkText>{customer.recommendedMark}</MarkText>
            )}
          </CardHeader>
          <Citation>{customer.citation}</Citation>
          {customer.recommendedReason === null ? null : (
            <ReasonText>{customer.recommendedReason}</ReasonText>
          )}
        </Card>
        <Actions>
          <OwnerPrompt>책방 주인에게 보여 주세요</OwnerPrompt>
          {ownerCheckNotice === null ? null : (
            <StatusText role="status" aria-label="주인 확인 안내">
              {ownerCheckNotice}
            </StatusText>
          )}
          <Button type="button" tone="primary" size="lg" fullWidth onClick={onOwnerCheck}>
            주인 확인
          </Button>
          <Button type="button" tone="link" onClick={onRetake}>
            다시 해 보기
          </Button>
        </Actions>
      </Lower>
    </Screen>
  );
}
