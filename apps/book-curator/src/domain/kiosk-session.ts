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
import { ownerView, type OwnerView } from "./owner-view.ts";
import type { DrawerId } from "./question-set.ts";
import { answer, back, startTurn, type Turn } from "./turn.ts";

/** 주인 확인 잠금. 토큰은 메모리에만 있고, 끝나면 `expired`로 남아 PIN 화면이 까닭을 알린다(I-15). */
export type OwnerAccess =
  | { readonly status: "locked" }
  | { readonly status: "unlocked"; readonly token: string; readonly expiresAt: string }
  | { readonly status: "expired" };

/** 열쇠를 건넨 뒤의 상태. 손님은 실제 서랍을 열어 책을 본다. */
export interface Handover {
  readonly drawer: DrawerId;
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
export type KioskPage = "start" | "question" | "result" | "owner-pin" | "owner-check" | "handed";

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
  | { readonly type: "hand_over"; readonly drawer: DrawerId; readonly now: number }
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
      const value = turn.answers[index];
      if (value === undefined) return unchanged(session);
      const answered = funnel(session.funnel, {
        type: "answer",
        questionId: questionIdAt(index),
        answer: value,
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
      return {
        session: {
          ...session,
          funnel: handed.state,
          handover: { drawer: action.drawer },
          lastActivityAt: action.now,
        },
        events: handed.events,
      };
    }
  }
}

/** 세션이 지금 있어야 할 화면. 들어올 수 없는 URL로 오면 라우트가 여기로 보낸다. */
export function homeOf(session: KioskSession): KioskPage {
  if (session.status !== "turn") return "start";
  if (session.handover !== null) return "handed";
  return isComplete(session) ? "result" : "question";
}

/** 이 세션으로 그 화면을 보여 줄 수 있는가. 라우트 guard가 쓴다. */
export function allows(session: KioskSession, page: KioskPage): boolean {
  const home = homeOf(session);
  switch (page) {
    case "start":
    case "question":
    case "result":
    case "handed":
      return home === page;
    case "owner-pin":
      return home === "result";
    case "owner-check":
      return home === "result" && session.status === "turn" && session.owner.status === "unlocked";
  }
}

/**
 * 이 세션으로 그 화면에 있을 수 없으면 대신 갈 화면, 있을 수 있으면 `null`이다.
 * 주인 확인이 잠겼으면 결과가 아니라 PIN 화면으로 보내 다시 풀게 한다.
 */
export function redirectFor(session: KioskSession, page: KioskPage): KioskPage | null {
  if (allows(session, page)) return null;
  const home = homeOf(session);
  return page === "owner-check" && home === "result" ? "owner-pin" : home;
}

/** 주인 확인 화면의 값. 결과가 없으면 `null`이다. */
export function ownerCheckOf(session: KioskSession): OwnerView | null {
  const curation = curationOf(session);
  if (session.status !== "turn" || curation === null) return null;
  return ownerView(curation, session.bundle.shelf);
}
