import type { Side, SessionEvent } from "./session.ts";

/** 로그 화면이 그리는 항목 하나. 이벤트에서 만든 표시용 값이다. */
export interface LogEntry {
  id: string;
  side: Side;
  speakerName: string;
  content: string;
  /** Instant, ISO 문자열 */
  createdAt: string;
}

/**
 * 이벤트 로그를 화면 항목으로 바꾼다. 화자 이름은 로그에 적힌 캐릭터에서 찾으므로,
 * 나중에 보관된 캐릭터의 지난 기록도 이름이 그대로 보인다.
 */
export function toLogEntries(events: SessionEvent[]): LogEntry[] {
  const names = new Map<string, string>();
  const entries: LogEntry[] = [];
  for (const event of events) {
    if (event.eventName === "session:started") {
      for (const character of event.body.characters) names.set(character.id, character.name);
    } else {
      entries.push({
        id: event.eventId,
        side: event.body.side,
        speakerName: names.get(event.body.as) ?? event.body.as,
        content: event.body.content,
        createdAt: event.eventCreatedAt,
      });
    }
  }
  return entries;
}
