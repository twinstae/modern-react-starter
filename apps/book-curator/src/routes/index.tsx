import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { styled } from "styled-system/jsx";

import { api } from "../api-client.ts";
import { createEventQueue } from "../application/event-queue.ts";
import {
  DrawerBooksScreen,
  type DrawerBooksScreenBook,
} from "../components/drawer-books-screen.tsx";
import { NicknameStart } from "../components/nickname-start.tsx";
import { OwnerCheckScreen } from "../components/owner-check-screen.tsx";
import { OwnerPinScreen } from "../components/owner-pin-screen.tsx";
import { QuestionScreen, type ItemScaleValue } from "../components/question-screen.tsx";
import { ResultScreen } from "../components/result-screen.tsx";
import type { ShelfBook } from "../domain/book.ts";
import { curate, type Curation } from "../domain/curate.ts";
import {
  funnel,
  type FunnelEvent,
  type FunnelState,
  type FunnelTransition,
  openFunnel,
  questionIdAt,
  type ResetReason,
} from "../domain/funnel.ts";
import { idleState } from "../domain/idle.ts";
import type { KioskBundle } from "../domain/kiosk.ts";
import { drawerBooksView, ownerView, type OwnerView } from "../domain/owner-view.ts";
import type { DrawerCode, QuestionSet } from "../domain/question-set.ts";
import type { DrawerStockEntry } from "../domain/shelf.ts";
import { answer, back, endTurn, startTurn, type Turn } from "../domain/turn.ts";
import { useWakeLock } from "../lib/use-wake-lock.ts";
import { OwnerTokenExpiredError, postHandover, postPurchase, unlockOwner } from "../owner-api.ts";
import { kioskQueries } from "../queries.ts";
import { unwrap } from "../unwrap.ts";

type ReadyBundle = Extract<KioskBundle, { status: "ready" }>;
type OwnerPhase = "customer" | "pin" | "check" | "books";
type PublicShelfBook = ReadyBundle["shelf"]["drawers"][number]["books"][number];

interface OwnerShelf {
  readonly stock: readonly DrawerStockEntry[];
  readonly books: readonly ShelfBook[];
  readonly drawerBooks: ReadonlyMap<DrawerCode, readonly PublicShelfBook[]>;
}

const KIOSK_NAME = (() => {
  const configured: unknown = import.meta.env.VITE_KIOSK_NAME;
  if (typeof configured !== "string") return "계산대 옆";
  const trimmed = configured.trim();
  return trimmed === "" ? "계산대 옆" : trimmed;
})();

const sendEvents = async (events: readonly FunnelEvent[]) => {
  await unwrap(api.events.post({ events: [...events] }));
};

/**
 * 차례가 시작될 때 고정한 공개 묶음에서 주인 확인·서랍 속 책에 필요한 값만 꺼낸다.
 * 서가를 다시 부르지 않아 차례 도중 수량이 바뀌어도 보던 책이 그대로 남는다(I-11).
 */
function readOwnerShelf(bundle: ReadyBundle): OwnerShelf {
  const stock: DrawerStockEntry[] = [];
  const books: ShelfBook[] = [];
  const drawerBooks = new Map<DrawerCode, readonly PublicShelfBook[]>();

  for (const drawer of bundle.shelf.drawers) {
    drawerBooks.set(drawer.drawer, drawer.books);
    for (const book of drawer.books) {
      stock.push({ drawer: drawer.drawer, bookId: book.bookId, quantity: book.quantity });
      books.push({
        id: book.bookId,
        title: book.title,
        author: book.author,
        reason: book.reason,
        question: book.question,
      });
    }
  }

  return { stock, books, drawerBooks };
}

/**
 * 손님 화면에는 건넨 서랍의 책만 넘긴다(I-9). `drawerBooksView`와 공개 서가의 서랍 목록은
 * 같은 서랍 속 책 순서에서 나오므로 index로 bookId만 붙인다.
 */
function handedBooksOf(shelf: OwnerShelf, handed: DrawerCode): DrawerBooksScreenBook[] {
  const source = shelf.drawerBooks.get(handed) ?? [];

  return drawerBooksView({ code: handed }, shelf.stock, shelf.books).map((book, index) => {
    const entry = source[index];
    if (entry === undefined) throw new Error("서랍 속 책 정보를 찾지 못했습니다");
    return { ...book, bookId: entry.bookId };
  });
}

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
  const [queue] = useState(() => createEventQueue(sendEvents));
  const [turn, setTurn] = useState<Turn | null>(null);
  const [bundle, setBundle] = useState<ReadyBundle | null>(null);
  const [funnelState, setFunnelState] = useState<FunnelState | null>(null);
  // StrictMode가 effect를 두 번 불러도 세션과 kiosk_ready는 한 번만 연다.
  const sessionOpened = useRef(false);
  const resetting = useRef(false);
  const [lastActivityAt, setLastActivityAt] = useState<number | null>(null);
  const [promptShown, setPromptShown] = useState(false);
  const [promptVisible, setPromptVisible] = useState(false);
  const [ownerPhase, setOwnerPhase] = useState<OwnerPhase>("customer");
  // 주인 토큰과 만료 시각은 이 라우트 메모리에만 둔다. 저장소·쿠키·URL에 쓰지 않는다(I-15).
  const [ownerToken, setOwnerToken] = useState<{ token: string; expiresAt: string } | null>(null);
  const [ownerNotice, setOwnerNotice] = useState<string | null>(null);
  const [handedDrawer, setHandedDrawer] = useState<DrawerCode | null>(null);
  const [handedBooks, setHandedBooks] = useState<readonly DrawerBooksScreenBook[] | null>(null);
  const [recordedBookIds, setRecordedBookIds] = useState<readonly string[]>([]);
  const [purchaseNotice, setPurchaseNotice] = useState<string | null>(null);

  const emit = useCallback(
    (transition: FunnelTransition) => {
      setFunnelState(transition.state);
      if (transition.events.length === 0) return;
      queue.enqueue(transition.events);
      // 전송은 최선이다. 실패해도 큐가 남고, 손님 흐름은 기다리지 않는다.
      void queue.flush();
    },
    [queue],
  );

  // 묶음이 준비된 순간 세션을 열고 kiosk_ready를 한 번 남긴다. 버전도 이때 고정한다.
  useEffect(() => {
    if (data.status !== "ready" || funnelState !== null || sessionOpened.current) return;

    sessionOpened.current = true;
    setBundle(data);
    emit(
      openFunnel({
        sessionId: crypto.randomUUID(),
        kioskName: KIOSK_NAME,
        version: data.version,
      }),
    );
  }, [data, emit, funnelState]);

  const resetToStart = useCallback(
    (reason: ResetReason) => {
      if (resetting.current) return;
      resetting.current = true;

      if (funnelState !== null) {
        emit(funnel(funnelState, { type: "reset", reason }));
      }
      setTurn(endTurn() ?? null);
      setBundle(null);
      setLastActivityAt(null);
      setPromptShown(false);
      setPromptVisible(false);
      setOwnerPhase("customer");
      setOwnerToken(null);
      setOwnerNotice(null);
      setHandedDrawer(null);
      setHandedBooks(null);
      setRecordedBookIds([]);
      setPurchaseNotice(null);
      void queryClient
        .refetchQueries({ queryKey: kioskQueries.current().queryKey, exact: true })
        .finally(() => {
          // 새 묶음이 온 뒤에 다음 세션을 연다. 그래야 kiosk_ready와 차례의 버전이 같다.
          sessionOpened.current = false;
          resetting.current = false;
          setFunnelState(null);
        });
    },
    [emit, funnelState, queryClient],
  );

  const touch = useCallback(() => {
    setLastActivityAt(Date.now());
    setPromptShown(false);
    setPromptVisible(false);
  }, []);

  // 주인 모드에서는 손님 유휴 타이머를 멈춘다. 주인은 PIN을 넣고 몇 초 안에 판단해야 하지만,
  // 서가를 살피는 시간을 90/120초로 자르지 않는다. 대신 10분 주인 토큰 만료가 안전장치다.
  useEffect(() => {
    if (turn === null || lastActivityAt === null || ownerPhase !== "customer") return;

    const tick = () => {
      const state = idleState(lastActivityAt, Date.now());
      if (state === "expired") {
        resetToStart("timeout");
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
  }, [turn, lastActivityAt, promptShown, resetToStart, ownerPhase]);

  useWakeLock(turn !== null);

  /** 주인 토큰이 끝나면 쓰기 동작을 닫는다. 건넨 뒤에는 화면을 유지하고 기록만 막는다. */
  const expireOwner = useCallback(() => {
    setOwnerToken(null);
    setOwnerPhase((phase) => (phase === "books" || phase === "customer" ? phase : "pin"));
    setOwnerNotice("주인 확인 시간이 끝났어요. PIN을 다시 넣어 주세요.");
    setPurchaseNotice("주인 확인 시간이 끝나 산 책 기록은 할 수 없어요.");
  }, []);

  // 토큰 만료 시각에 맞춰 한 번 깨운다. 화면을 닫아 두어도 다음 동작 전에 상태가 맞는다.
  useEffect(() => {
    if (ownerToken === null) return;

    const remaining = Date.parse(ownerToken.expiresAt) - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) {
      expireOwner();
      return;
    }

    const timer = window.setTimeout(expireOwner, remaining);
    return () => window.clearTimeout(timer);
  }, [ownerToken, expireOwner]);

  const start = (nickname: string) => {
    if (bundle === null || funnelState === null || funnelState.phase !== "ready") return;
    setTurn(startTurn(nickname, funnelState.sessionId));
    emit(funnel(funnelState, { type: "start" }));
    touch();
  };

  const respond = (value: ItemScaleValue) => {
    if (turn === null || bundle === null || funnelState === null) return;
    if (funnelState.phase !== "started") return;

    const next = answer(bundle.questionSet, turn, value);
    const transition = funnel(funnelState, {
      type: "answer",
      questionId: questionIdAt(turn.answers.length),
      answer: value,
      questionIndex: turn.answers.length,
    });
    emit(transition);

    if (next.answers.length === bundle.questionSet.questions.length) {
      const curation = curateTurn(bundle.questionSet, next);
      if (curation !== null) {
        emit(
          funnel(transition.state, {
            type: "view_result",
            ranking: curation.ranking,
            scores: curation.scores,
          }),
        );
      }
    }

    setTurn(next);
    touch();
  };

  const goBack = () => {
    if (turn === null || funnelState === null) return;
    if (funnelState.phase !== "started" || turn.answers.length === 0) return;

    emit(
      funnel(funnelState, {
        type: "back",
        questionId: questionIdAt(turn.answers.length - 1),
      }),
    );
    setTurn(back(turn));
    touch();
  };

  const openOwnerPin = () => {
    setOwnerToken(null);
    setOwnerNotice(null);
    setPurchaseNotice(null);
    setOwnerPhase("pin");
    touch();
  };

  const cancelOwner = () => {
    setOwnerPhase("customer");
    setOwnerToken(null);
    setOwnerNotice(null);
    setPurchaseNotice(null);
    touch();
  };

  const unlock = async (pin: string): Promise<string | undefined> => {
    const result = await unlockOwner(pin);
    if (!result.ok) return result.message;

    setOwnerToken(result.unlock);
    setOwnerNotice(null);
    setPurchaseNotice(null);
    setOwnerPhase("check");
    touch();
    return undefined;
  };

  /** 주인이 고른 서랍을 기록하고 손님을 서랍 속 책 안내로 넘긴다. 추천과 달라도 된다(R-7). */
  const handover = async (handed: DrawerCode) => {
    if (bundle === null || turn === null || funnelState === null) return;
    if (ownerToken === null) {
      expireOwner();
      return;
    }

    const curation = curateTurn(bundle.questionSet, turn);
    if (curation === null) {
      setOwnerNotice("결과를 다시 만들지 못했어요. 손님 화면으로 돌아가 주세요.");
      return;
    }

    const shelf = readOwnerShelf(bundle);
    let books: DrawerBooksScreenBook[];
    try {
      books = handedBooksOf(shelf, handed);
    } catch {
      setOwnerNotice("서랍 속 책을 읽지 못했어요. 손님 화면으로 돌아가 주세요.");
      return;
    }

    try {
      await postHandover(ownerToken.token, {
        sessionId: funnelState.sessionId,
        version: funnelState.version,
        recommended: curation.ranking.first,
        handed,
      });
    } catch (error) {
      if (error instanceof OwnerTokenExpiredError) {
        expireOwner();
        return;
      }
      setOwnerNotice("열쇠 건넴을 기록하지 못했어요. 잠시 뒤 다시 해 주세요.");
      return;
    }

    const handoverTransition = funnel(funnelState, {
      type: "handover",
      recommended: curation.ranking.first,
      handed,
    });
    emit(handoverTransition);

    let state = handoverTransition.state;
    for (const book of books) {
      const viewed = funnel(state, { type: "book_view", bookId: book.bookId });
      emit(viewed);
      state = viewed.state;
    }

    setHandedDrawer(handed);
    setHandedBooks(books);
    setRecordedBookIds([]);
    setPurchaseNotice(null);
    setOwnerNotice(null);
    setOwnerPhase("books");
    touch();
  };

  /** 산 책을 남기고, 다시 부르지 않고 지금 화면의 수량만 줄인다(I-11). */
  const purchase = async (bookId: string) => {
    if (funnelState === null || handedDrawer === null) return;
    if (ownerToken === null) {
      setPurchaseNotice("주인 확인 시간이 끝나 산 책 기록은 할 수 없어요.");
      return;
    }

    try {
      const quantity = await postPurchase(ownerToken.token, {
        sessionId: funnelState.sessionId,
        version: funnelState.version,
        drawer: handedDrawer,
        bookId,
      });
      emit(funnel(funnelState, { type: "purchase", bookId, drawer: handedDrawer }));
      setHandedBooks((current) =>
        current === null
          ? current
          : current.map((book) => (book.bookId === bookId ? { ...book, quantity } : book)),
      );
      setRecordedBookIds((ids) => (ids.includes(bookId) ? ids : [...ids, bookId]));
      setPurchaseNotice(null);
      touch();
    } catch (error) {
      if (error instanceof OwnerTokenExpiredError) {
        expireOwner();
        return;
      }
      setPurchaseNotice("산 책 기록을 남기지 못했어요. 잠시 뒤 다시 해 주세요.");
    }
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
    return <NicknameStart questionCount={data.questionSet.questions.length} onStart={start} />;
  }

  const question = bundle.questionSet.questions[turn.answers.length];
  const total = bundle.questionSet.questions.length;
  const curation = question === undefined ? curateTurn(bundle.questionSet, turn) : null;

  let ownerCheck: OwnerView | null = null;
  if (ownerPhase === "check" && curation !== null) {
    try {
      const shelf = readOwnerShelf(bundle);
      ownerCheck = ownerView(curation, shelf.stock, shelf.books);
    } catch {
      ownerCheck = null;
    }
  }

  const handedInfo =
    handedDrawer === null
      ? undefined
      : bundle.questionSet.drawers.find((drawer) => drawer.code === handedDrawer);

  let content: React.ReactNode;
  if (question === undefined) {
    if (curation === null) {
      content = (
        <Screen>
          <Title>결과를 만들지 못했어요</Title>
          <Body>다시 답하면 결과를 만들 수 있어요.</Body>
          <QuietButton type="button" onClick={() => resetToStart("manual")}>
            다시 하기
          </QuietButton>
        </Screen>
      );
    } else if (ownerPhase === "pin") {
      content = <OwnerPinScreen notice={ownerNotice} onUnlock={unlock} onCancel={cancelOwner} />;
    } else if (ownerPhase === "check" && ownerCheck !== null) {
      content = (
        <OwnerCheckScreen
          view={ownerCheck}
          notice={ownerNotice}
          onHandover={(drawer) => {
            void handover(drawer);
          }}
          onCancel={cancelOwner}
        />
      );
    } else if (ownerPhase === "books" && handedBooks !== null && handedInfo !== undefined) {
      content = (
        <DrawerBooksScreen
          drawer={{ name: handedInfo.name, mark: handedInfo.mark }}
          books={handedBooks}
          canRecordPurchase={ownerToken !== null}
          recordedBookIds={recordedBookIds}
          notice={purchaseNotice}
          onPurchase={(bookId) => {
            void purchase(bookId);
          }}
          onFinish={() => resetToStart("completed")}
        />
      );
    } else {
      content = (
        <ResultScreen
          customer={curation.customer}
          similar={curation.ranking.similar}
          onOwnerCheck={openOwnerPin}
          onRetake={() => resetToStart("completed")}
        />
      );
    }
  } else if (question.type === "choice") {
    content = (
      <Screen>
        <Title>이 질문은 아직 준비 중이에요</Title>
        <Body>문항형 질문만 보여 드릴 수 있어요. 처음으로 돌아가 주세요.</Body>
        <QuietButton type="button" onClick={() => resetToStart("manual")}>
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
            <QuietButton type="button" onClick={() => resetToStart("manual")}>
              처음으로
            </QuietButton>
          </PromptCard>
        </PromptLayer>
      ) : null}
    </>
  );
}
