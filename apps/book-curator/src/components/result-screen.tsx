import { styled } from "styled-system/jsx";

import type { CustomerCuration } from "../domain/curate.ts";
import {
  BodyText,
  Button,
  Card,
  CardTitle,
  MarkText,
  MutedText,
  ReasonText,
  ResultTitle,
  Screen,
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
      aria-label="결과"
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
        <BodyText color="fg.muted">{customer.secondStatement}</BodyText>
        {similar ? (
          <SimilarLine>두 서랍이 비슷하게 보여요. 주인과 함께 골라도 좋아요.</SimilarLine>
        ) : null}
      </Statements>
      <Lower>
        <Card tone="paper" aria-labelledby="recommended-drawer-name">
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
