import { styled } from "styled-system/jsx";

import type { CustomerCuration } from "../domain/curate.ts";
import {
  Actions,
  BodyText,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Citation,
  MutedText,
  ResultTitle,
  Screen,
  SectionTitle,
  StatusText,
} from "../ui/index.ts";

const ResultScroller = styled(Screen, {
  base: {
    height: "100dvh",
    overflowY: "auto",
    overscrollBehavior: "contain",
    scrollSnapType: "y mandatory",
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "-3px" },
  },
});

const Panel = styled("section", {
  base: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "6",
    minH: "100dvh",
    px: "page",
    py: "10",
    scrollSnapAlign: "start",
    scrollSnapStop: "always",
    textAlign: "center",
  },
});

const ScrollCue = styled("p", {
  base: {
    position: "absolute",
    bottom: "6",
    left: "50%",
    translate: "-50% 0",
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "kiosk-caption",
  },
});

/**
 * 결과 화면. 손님 view model만 받아 상태 문장 두 개와 추천 서랍을 그린다.
 * 점수·서랍 코드·서랍 속 책은 받지도 보여 주지도 않는다(I-9, C-2).
 * 첫 칸은 지금 필요한 서랍을 읽고, 다음 칸은 그 이유와 주인에게 건네는 일을 맡는다.
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
    <ResultScroller aria-label="결과" tabIndex={0}>
      <Panel aria-label="지금 필요한 서랍">
        <ResultTitle>{customer.firstStatement}</ResultTitle>
        <BodyText color="fg.muted" maxW="44rem" fontSize="1.5rem">
          {customer.secondStatement}
        </BodyText>
        {similar ? (
          <MutedText textAlign="center">
            두 서랍이 비슷하게 보여요. 주인과 함께 골라도 좋아요.
          </MutedText>
        ) : null}
        <ScrollCue aria-hidden="true">↓</ScrollCue>
      </Panel>

      <Panel aria-label="추천 서랍과 다음">
        <Card
          tone="paper"
          width="full"
          maxW="56rem"
          p="6"
          aria-labelledby="recommended-drawer-name"
        >
          <CardHeader>
            <CardTitle id="recommended-drawer-name">{customer.recommendedDrawerName}</CardTitle>
          </CardHeader>
          <Citation fontSize="1.5rem">{customer.citation}</Citation>
        </Card>

        <SectionTitle>이제 책방 주인에게 보여 주세요</SectionTitle>
        {ownerCheckNotice === null ? null : (
          <StatusText role="status" aria-label="주인 확인 안내">
            {ownerCheckNotice}
          </StatusText>
        )}
        <Actions direction="column" align="center" width="full" maxW="30rem">
          <Button type="button" tone="primary" size="lg" fullWidth onClick={onOwnerCheck}>
            주인 확인
          </Button>
          <Button type="button" tone="link" onClick={onRetake}>
            다시 해 보기
          </Button>
        </Actions>
      </Panel>
    </ResultScroller>
  );
}
