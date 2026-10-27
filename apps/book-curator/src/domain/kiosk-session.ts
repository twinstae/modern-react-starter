import type { ShelfBook } from "./book.ts";
import { curate, type Curation } from "./curate.ts";
import {
  funnel,
  openFunnel,
  questionIdAt,
  type FunnelEvent,
  type FunnelState,
  type ResetReason,
} from "./funnel.ts";
import type { ReadyKioskBundle } from "./kiosk.ts";
import { drawerBooksView, ownerView, type DrawerBookView, type OwnerView } from "./owner-view.ts";
import type { DrawerCode } from "./question-set.ts";
import type { DrawerStockEntry } from "./shelf.ts";
import { answer, back, startTurn, type Turn } from "./turn.ts";

/** 주인 확인 잠금. 토큰은 메모리에만 있고, 끝나면 `expired`로 남아 PIN 화면이 까닭을 알린다(I-15). */
export type OwnerAccess =
  | { readonly status: "locked" }
  | { readonly status: "unlocked"; readonly token: string; readonly expiresAt: string }
  | { readonly status: "expired" };

/** 손님에게 건넨 서랍의 책. 공개 서가의 bookId를 붙여 산 책을 기록할 수 있다. */
export interface HandedBook extends DrawerBookView {
  readonly bookId: string;
}

/** 열쇠를 건넨 뒤의 상태. 산 책을 기록할 때마다 그 책의 수량만 줄인다(I-11). */
export interface Handover {
  readonly drawer: DrawerCode;
  readonly books: readonly HandedBook[];
  readonly recordedBookIds: readonly string[];
}

/**
 * 키오스크 한 차례의 메모리 상태. 어느 화면인지는 URL이 정하고, 이 값은 URL에 둘 수 없는
 * 것(별명, 답, 주인 토큰)만 가진다. 묶음은 세션을 열 때 고정한다(I-11).
 *
 * - `closed`: 세션이 없다. 처음 화면이 새 묶음을 받으면 연다.
 * - `ready`: kiosk_ready를 남겼고 별명을 기다린다.
 * - `turn`: 손님이 시작했다. 끝나면 `closed`로 돌아가 별명·답이 남지 않는다(I-13).
 */
export type KioskSession =
  | { readonly status: "closed" }
  | { readonly status: "ready"; readonly bundle: ReadyKioskBundle; readonly funnel: FunnelState }
  | {
      readonly status: "turn";
      readonly bundle: ReadyKioskBundle;
      readonly funnel: FunnelState;
      readonly turn: Turn;
      /** 유휴 타이머가 보는 마지막 활동 시각(ms). */
      readonly lastActivityAt: number;
      readonly owner: OwnerAccess;
      readonly handover: Handover | null;
    };

type TurnSession = Extract<KioskSession, { status: "turn" }>;

export const CLOSED: KioskSession = { status: "closed" };

/** 키오스크 화면. 라우트 하나가 하나씩 맡는다. */
export type KioskPage =
  | "start"
  | "question"
  | "result"
  | "owner-pin"
  | "owner-check"
  | "owner-books";

export type KioskAction =
  | {
      readonly type: "open";
      readonly bundle: ReadyKioskBundle;
      readonly sessionId: string;
      readonly kioskName: string;
    }
  | { readonly type: "start"; readonly nickname: string; readonly now: number }
  | { readonly type: "answer"; readonly value: unknown; readonly now: number }
  | { readonly type: "back"; readonly now: number }
  | { readonly type: "touch"; readonly now: number }
  | {
      readonly type: "unlock";
      readonly owner: { readonly token: string; readonly expiresAt: string };
      readonly now: number;
    }
  | { readonly type: "lock"; readonly now: number }
  | { readonly type: "owner_expired" }
  | {
      readonly type: "hand_over";
      readonly drawer: DrawerCode;
      readonly books: readonly HandedBook[];
      readonly now: number;
    }
  | {
      readonly type: "purchase";
      readonly bookId: string;
      readonly quantity: number;
      readonly now: number;
    }
  | { readonly type: "reset"; readonly reason: ResetReason };

export interface KioskTransition {
  readonly session: KioskSession;
  /** 서버로 보낼 퍼널 이벤트. 전송은 호출하는 쪽이 맡는다. */
  readonly events: readonly FunnelEvent[];
}

const unchanged = (session: KioskSession): KioskTransition => ({ session, events: [] });

const isComplete = (session: TurnSession) =>
  session.turn.answers.length === session.bundle.questionSet.questions.length;

/** 마지막 답까지 했으면 결과를 만든다. 인용할 답이 없거나 세트가 어긋나면 `null`이다. */
export function curationOf(session: KioskSession): Curation | null {
  if (session.status !== "turn" || !isComplete(session)) return null;
  try {
    return curate(session.bundle.questionSet, session.turn.answers, session.turn.nickname);
  } catch {
    return null;
  }
}

/** 손님 차례의 순수 전이. 이 전이에 맞지 않는 액션은 상태를 바꾸지 않는다. */
export function nextKioskSession(session: KioskSession, action: KioskAction): KioskTransition {
  if (action.type === "open") {
    if (session.status !== "closed") return unchanged(session);
    const opened = openFunnel({
      sessionId: action.sessionId,
      kioskName: action.kioskName,
      version: action.bundle.version,
    });
    return {
      session: { status: "ready", bundle: action.bundle, funnel: opened.state },
      events: opened.events,
    };
  }

  if (action.type === "reset") {
    if (session.status === "closed") return unchanged(session);
    return { session: CLOSED, events: funnel(session.funnel, action).events };
  }

  if (action.type === "start") {
    if (session.status !== "ready") return unchanged(session);
    const started = funnel(session.funnel, { type: "start" });
    return {
      session: {
        status: "turn",
        bundle: session.bundle,
        funnel: started.state,
        turn: startTurn(action.nickname, session.funnel.sessionId),
        lastActivityAt: action.now,
        owner: { status: "locked" },
        handover: null,
      },
      events: started.events,
    };
  }

  if (session.status !== "turn") return unchanged(session);
  return nextTurn(session, action);
}

function nextTurn(
  session: TurnSession,
  action: Exclude<KioskAction, { type: "open" | "reset" | "start" }>,
): KioskTransition {
  switch (action.type) {
    case "touch":
      return { session: { ...session, lastActivityAt: action.now }, events: [] };

    case "answer": {
      if (session.handover !== null || isComplete(session)) return unchanged(session);
      let turn: Turn;
      try {
        turn = answer(session.bundle.questionSet, session.turn, action.value);
      } catch {
        return unchanged(session);
      }
      const index = session.turn.answers.length;
      const answered = funnel(session.funnel, {
        type: "answer",
        questionId: questionIdAt(index),
        answer: turn.answers[index] ?? 0,
        questionIndex: index,
      });
      const next: TurnSession = {
        ...session,
        turn,
        funnel: answered.state,
        lastActivityAt: action.now,
      };
      const curation = curationOf(next);
      if (curation === null) return { session: next, events: answered.events };

      const viewed = funnel(answered.state, {
        type: "view_result",
        ranking: curation.ranking,
        scores: curation.scores,
      });
      return {
        session: { ...next, funnel: viewed.state },
        events: [...answered.events, ...viewed.events],
      };
    }

    case "back": {
      const count = session.turn.answers.length;
      // 결과를 본 뒤에는 뒤로 가지 않는다. 퍼널도 result 뒤의 back을 받지 않는다(I-14).
      if (homeOf(session) !== "question" || count === 0) return unchanged(session);
      const backed = funnel(session.funnel, { type: "back", questionId: questionIdAt(count - 1) });
      return {
        session: {
          ...session,
          turn: back(session.turn),
          funnel: backed.state,
          lastActivityAt: action.now,
        },
        events: backed.events,
      };
    }

    case "unlock":
      if (!allows(session, "owner-pin")) return unchanged(session);
      return {
        session: {
          ...session,
          owner: { status: "unlocked", ...action.owner },
          lastActivityAt: action.now,
        },
        events: [],
      };

    case "lock":
      return {
        session: { ...session, owner: { status: "locked" }, lastActivityAt: action.now },
        events: [],
      };

    case "owner_expired":
      if (session.owner.status !== "unlocked") return unchanged(session);
      return { session: { ...session, owner: { status: "expired" } }, events: [] };

    case "hand_over": {
      const curation = curationOf(session);
      if (!allows(session, "owner-check") || curation === null) return unchanged(session);
      const handed = funnel(session.funnel, {
        type: "handover",
        recommended: curation.ranking.first,
        handed: action.drawer,
      });
      let state = handed.state;
      const events = [...handed.events];
      for (const book of action.books) {
        const viewed = funnel(state, { type: "book_view", bookId: book.bookId });
        state = viewed.state;
        events.push(...viewed.events);
      }
      return {
        session: {
          ...session,
          funnel: state,
          handover: { drawer: action.drawer, books: action.books, recordedBookIds: [] },
          lastActivityAt: action.now,
        },
        events,
      };
    }

    case "purchase": {
      const { handover } = session;
      if (handover === null) return unchanged(session);
      const purchased = funnel(session.funnel, {
        type: "purchase",
        bookId: action.bookId,
        drawer: handover.drawer,
      });
      return {
        session: {
          ...session,
          funnel: purchased.state,
          handover: {
            drawer: handover.drawer,
            books: handover.books.map((book) =>
              book.bookId === action.bookId ? { ...book, quantity: action.quantity } : book,
            ),
            recordedBookIds: handover.recordedBookIds.includes(action.bookId)
              ? handover.recordedBookIds
              : [...handover.recordedBookIds, action.bookId],
          },
          lastActivityAt: action.now,
        },
        events: purchased.events,
      };
    }
  }
}

/** 세션이 지금 있어야 할 화면. 들어올 수 없는 URL로 오면 라우트가 여기로 보낸다. */
export function homeOf(session: KioskSession): KioskPage {
  if (session.status !== "turn") return "start";
  if (session.handover !== null) return "owner-books";
  return isComplete(session) ? "result" : "question";
}

/** 이 세션으로 그 화면을 보여 줄 수 있는가. 라우트 guard가 쓴다. */
export function allows(session: KioskSession, page: KioskPage): boolean {
  const home = homeOf(session);
  switch (page) {
    case "start":
    case "question":
    case "result":
    case "owner-books":
      return home === page;
    case "owner-pin":
      return home === "result";
    case "owner-check":
      return home === "result" && session.status === "turn" && session.owner.status === "unlocked";
  }
}

interface OwnerShelf {
  readonly stock: readonly DrawerStockEntry[];
  readonly books: readonly ShelfBook[];
}

/**
 * 세션을 열 때 고정한 공개 묶음에서 주인 확인·서랍 속 책에 필요한 값만 꺼낸다.
 * 서가를 다시 부르지 않아 차례 도중 수량이 바뀌어도 보던 책이 그대로 남는다(I-11).
 */
function ownerShelfOf(bundle: ReadyKioskBundle): OwnerShelf {
  const drawers = bundle.shelf.drawers;
  return {
    stock: drawers.flatMap(({ drawer, books }) =>
      books.map(({ bookId, quantity }) => ({ drawer, bookId, quantity })),
    ),
    books: drawers.flatMap(({ books }) =>
      books.map(({ bookId, title, author, reason, question }) => ({
        id: bookId,
        title,
        author,
        reason,
        question,
      })),
    ),
  };
}

/** 주인 확인 화면의 값. 결과가 없거나 서가가 어긋나면 `null`이다. */
export function ownerCheckOf(session: KioskSession): OwnerView | null {
  const curation = curationOf(session);
  if (session.status !== "turn" || curation === null) return null;
  try {
    const shelf = ownerShelfOf(session.bundle);
    return ownerView(curation, shelf.stock, shelf.books);
  } catch {
    return null;
  }
}

/**
 * 건넨 서랍의 책만 꺼낸다(I-9). `drawerBooksView`와 공개 서가의 서랍 목록은 같은 순서에서
 * 나오므로 index로 bookId를 붙인다. 서가가 어긋나면 던진다.
 */
export function handedBooksOf(bundle: ReadyKioskBundle, drawer: DrawerCode): HandedBook[] {
  const shelf = ownerShelfOf(bundle);
  const source = bundle.shelf.drawers.find((entry) => entry.drawer === drawer)?.books ?? [];

  return drawerBooksView({ code: drawer }, shelf.stock, shelf.books).map((book, index) => {
    const entry = source[index];
    if (entry === undefined) throw new Error("서랍 속 책 정보를 찾지 못했습니다");
    return { ...book, bookId: entry.bookId };
  });
}
