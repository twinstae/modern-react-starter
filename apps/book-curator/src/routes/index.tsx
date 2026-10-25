import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { styled } from "styled-system/jsx";

import { NicknameStart } from "../components/nickname-start.tsx";
import { QuestionScreen, type ItemScaleValue } from "../components/question-screen.tsx";
import { ResultScreen } from "../components/result-screen.tsx";
import { curate, type Curation } from "../domain/curate.ts";
import { idleState } from "../domain/idle.ts";
import type { KioskBundle } from "../domain/kiosk.ts";
import type { QuestionSet } from "../domain/question-set.ts";
import { answer, back, endTurn, startTurn, type Turn } from "../domain/turn.ts";
import { useWakeLock } from "../lib/use-wake-lock.ts";
import { kioskQueries } from "../queries.ts";

type ReadyBundle = Extract<KioskBundle, { status: "ready" }>;

export const Route = createFileRoute("/")({
  // 처음 화면에 들어올 때마다 새 묶음을 받는다. 차례가 시작되면 그 묶음을 메모리에 고정한다.
  loader: ({ context }) => context.queryClient.query({ ...kioskQueries.current(), staleTime: 0 }),
  component: Kiosk,
});

const Screen = styled("main", {
  base: {
    minH: "100dvh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "6",
    px: "page",
    py: "12",
    bg: "canvas",
    color: "fg.default",
    textAlign: "center",
  },
});

const Title = styled("h1", {
  base: { fontFamily: "heading", fontSize: "kiosk-title", fontWeight: "600" },
});

const Body = styled("p", { base: { color: "fg.muted", fontSize: "kiosk-body" } });

const QuietButton = styled("button", {
  base: {
    borderWidth: "0",
    borderRadius: "l2",
    bg: "transparent",
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "kiosk-body",
    cursor: "pointer",
    px: "4",
    py: "3",
    _hover: { color: "fg.default", bg: "paper.200" },
    _focusVisible: { outline: "2px solid", outlineColor: "ink.900", outlineOffset: "2px" },
  },
});

const PromptLayer = styled("div", {
  base: {
    position: "fixed",
    inset: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    bg: "rgba(33, 28, 23, 0.45)",
    zIndex: "modal",
  },
});

const PromptCard = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4",
    maxW: "xl",
    mx: "6",
    px: "8",
    py: "10",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    textAlign: "center",
    boxShadow: "lg",
  },
});

const PromptTitle = styled("h2", {
  base: { fontFamily: "heading", fontSize: "kiosk-question", fontWeight: "600" },
});

/**
 * 마지막 답을 결과로 바꾼다. 인용할 답이 없거나 질문 세트가 어긋나면 화면이 죽지 않도록
 * `null`을 돌려주고, 라우트는 조용한 대체 화면을 보여 준다.
 */
function curateTurn(questionSet: QuestionSet, turn: Turn): Curation | null {
  try {
    return curate(questionSet, turn.answers, turn.nickname);
  } catch {
    return null;
  }
}

function Kiosk() {
  const { data } = useSuspenseQuery(kioskQueries.current());
  const queryClient = useQueryClient();
  const [turn, setTurn] = useState<Turn | null>(null);
  const [bundle, setBundle] = useState<ReadyBundle | null>(null);
  const [lastActivityAt, setLastActivityAt] = useState<number | null>(null);
  const [promptShown, setPromptShown] = useState(false);
  const [promptVisible, setPromptVisible] = useState(false);
  const [ownerCheckNotice, setOwnerCheckNotice] = useState<string | null>(null);

  const resetToStart = useCallback(() => {
    setTurn(endTurn() ?? null);
    setBundle(null);
    setLastActivityAt(null);
    setPromptShown(false);
    setPromptVisible(false);
    setOwnerCheckNotice(null);
    void queryClient.refetchQueries({ queryKey: kioskQueries.current().queryKey, exact: true });
  }, [queryClient]);

  const touch = useCallback(() => {
    setLastActivityAt(Date.now());
    setPromptShown(false);
    setPromptVisible(false);
  }, []);

  useEffect(() => {
    if (turn === null || lastActivityAt === null) return;

    const tick = () => {
      const state = idleState(lastActivityAt, Date.now());
      if (state === "expired") {
        resetToStart();
        return;
      }
      if (state === "prompt" && !promptShown) {
        setPromptShown(true);
        setPromptVisible(true);
      }
    };

    tick();
    const timer = window.setInterval(tick, 1_000);
    return () => window.clearInterval(timer);
  }, [turn, lastActivityAt, promptShown, resetToStart]);

  useWakeLock(turn !== null);

  const start = (nickname: string) => {
    if (data.status !== "ready") return;
    setBundle(data);
    setTurn(startTurn(nickname, crypto.randomUUID()));
    setOwnerCheckNotice(null);
    touch();
  };

  const respond = (value: ItemScaleValue) => {
    if (turn === null || bundle === null) return;
    setTurn(answer(bundle.questionSet, turn, value));
    touch();
  };

  const goBack = () => {
    if (turn === null) return;
    setTurn(back(turn));
    touch();
  };

  if (data.status === "preparing") {
    return (
      <Screen>
        <Title>지금, 어떤 책이 필요한가</Title>
        <Body role="status" aria-label="준비 상태">
          질문을 준비하고 있어요. 잠시만 기다려 주세요.
        </Body>
      </Screen>
    );
  }

  if (turn === null || bundle === null) {
    return <NicknameStart onStart={start} />;
  }

  const question = bundle.questionSet.questions[turn.answers.length];
  const total = bundle.questionSet.questions.length;
  const curation = question === undefined ? curateTurn(bundle.questionSet, turn) : null;

  let content: React.ReactNode;
  if (question === undefined) {
    content =
      curation === null ? (
        <Screen>
          <Title>결과를 준비하지 못했어요</Title>
          <Body>질문에 다시 답하면 큐레이터의 문장을 만들 수 있어요.</Body>
          <QuietButton type="button" onClick={resetToStart}>
            다시 해 보기
          </QuietButton>
        </Screen>
      ) : (
        <ResultScreen
          customer={curation.customer}
          similar={curation.ranking.similar}
          ownerCheckNotice={ownerCheckNotice}
          onOwnerCheck={() => setOwnerCheckNotice("주인 확인은 다음 단계에서 연결됩니다")}
          onRetake={resetToStart}
        />
      );
  } else if (question.type === "choice") {
    content = (
      <Screen>
        <Title>이 질문은 아직 화면에 없어요</Title>
        <Body>문항형 질문만 보여 드릴 수 있어요. 처음으로 돌아가 주세요.</Body>
        <QuietButton type="button" onClick={resetToStart}>
          처음으로
        </QuietButton>
      </Screen>
    );
  } else {
    content = (
      <QuestionScreen
        key={turn.answers.length}
        questionText={question.text}
        index={turn.answers.length}
        total={total}
        onAnswer={respond}
        onBack={goBack}
      />
    );
  }

  return (
    <>
      {content}
      {promptVisible ? (
        <PromptLayer>
          <PromptCard role="alertdialog" aria-modal="true" aria-labelledby="idle-prompt-title">
            <PromptTitle id="idle-prompt-title">계속하시겠어요?</PromptTitle>
            <Body>잠시 응답이 없어요. 이대로 두면 처음 화면으로 돌아갑니다.</Body>
            <QuietButton type="button" onClick={touch}>
              계속하기
            </QuietButton>
            <QuietButton type="button" onClick={resetToStart}>
              처음으로
            </QuietButton>
          </PromptCard>
        </PromptLayer>
      ) : null}
    </>
  );
}
