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

/** 마스터(GM)가 `2d6+1`을 굴려 [4, 6]과 상수 1, 합계 11이 나온 판정 */
export const rolledEvent = (sessionId: string, version: number, label?: string): SessionEvent => ({
  eventId: `${sessionId}-event-${version}`,
  eventName: "session:dice_rolled",
  eventCreatedAt: "2026-10-07T12:00:00Z",
  entityName: "session",
  entityId: sessionId,
  version,
  body: {
    side: "master",
    as: "gm",
    notation: "2d6+1",
    terms: [
      { type: "dice", sign: 1, sides: 6, values: [4, 6] },
      { type: "constant", sign: 1, value: 1 },
    ],
    total: 11,
    ...(label !== undefined && { label }),
  },
});
