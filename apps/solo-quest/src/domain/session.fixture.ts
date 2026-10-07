import { DEFAULT_CHARACTERS, type SessionEvent } from "./session.ts";

/** 테스트용 이벤트. 시각과 id는 고정이다. */
export const startedEvent = (sessionId: string): SessionEvent => ({
  eventId: `${sessionId}-event-1`,
  eventName: "session:started",
  eventCreatedAt: "2026-10-07T12:00:00Z",
  entityName: "session",
  entityId: sessionId,
  version: 1,
  body: { characters: DEFAULT_CHARACTERS },
});

export const postedEvent = (
  sessionId: string,
  version: number,
  content: string,
  side: "master" | "player" = "master",
): SessionEvent => ({
  eventId: `${sessionId}-event-${version}`,
  eventName: "session:message_posted",
  eventCreatedAt: "2026-10-07T12:00:00Z",
  entityName: "session",
  entityId: sessionId,
  version,
  body: { side, as: side === "master" ? "gm" : "player", content },
});
