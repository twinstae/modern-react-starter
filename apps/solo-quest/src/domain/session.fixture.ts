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
  speakerId = side === "master" ? "gm" : "player",
): SessionEvent => ({
  eventId: `${sessionId}-event-${version}`,
  eventName: "session:message_posted",
  eventCreatedAt: "2026-10-07T12:00:00Z",
  entityName: "session",
  entityId: sessionId,
  version,
  body: { side, as: speakerId, content },
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

/** 마스터(GM)가 `행동` 오라클을 굴려 53이 나와 `절벽`이 나온 기록 */
export const oracleRolledEvent = (
  sessionId: string,
  version: number,
  result = "절벽",
  value = 53,
): SessionEvent => ({
  eventId: `${sessionId}-event-${version}`,
  eventName: "session:oracle_rolled",
  eventCreatedAt: "2026-10-07T12:00:00Z",
  entityName: "session",
  entityId: sessionId,
  version,
  body: {
    side: "master",
    as: "gm",
    oracleId: "location",
    oracleName: "장소",
    sides: 100,
    value,
    result,
  },
});

export const characterAddedEvent = (
  sessionId: string,
  version: number,
  characterId: string,
  name: string,
): SessionEvent => ({
  eventId: `${sessionId}-event-${version}`,
  eventName: "session:character_added",
  eventCreatedAt: "2026-10-07T12:00:00Z",
  entityName: "session",
  entityId: sessionId,
  version,
  body: { characterId, name },
});

export const characterArchivedEvent = (
  sessionId: string,
  version: number,
  characterId: string,
): SessionEvent => ({
  eventId: `${sessionId}-event-${version}`,
  eventName: "session:character_archived",
  eventCreatedAt: "2026-10-07T12:00:00Z",
  entityName: "session",
  entityId: sessionId,
  version,
  body: { characterId },
});
