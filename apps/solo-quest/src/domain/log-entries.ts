import type { RolledTerm } from "./dice.ts";
import type { Side, SessionEvent } from "./session.ts";

/** 어느 항목이든 가진 값 */
interface BaseEntry {
  id: string;
  side: Side;
  speakerName: string;
  /** Instant, ISO 문자열 */
  createdAt: string;
}

export interface MessageEntry extends BaseEntry {
  kind: "message";
  content: string;
}

export interface RollEntry extends BaseEntry {
  kind: "roll";
  /** 입력한 그대로의 표기 */
  notation: string;
  terms: RolledTerm[];
  total: number;
  label?: string;
}

/** 로그 화면이 그리는 항목 하나. 이벤트에서 만든 표시용 값이다. */
export type LogEntry = MessageEntry | RollEntry;

/**
 * 이벤트 로그를 화면 항목으로 바꾼다. 화자 이름은 시작할 때 넘겨받았거나 나중에 추가한 캐릭터에서
 * id로 찾는다. 보관해도 이름은 남으므로 보관된 캐릭터의 지난 기록도 이름이 그대로 보인다.
 */
export function toLogEntries(events: SessionEvent[]): LogEntry[] {
  const names = new Map<string, string>();
  const entries: LogEntry[] = [];
  for (const event of events) {
    if (event.eventName === "session:started") {
      for (const character of event.body.characters) names.set(character.id, character.name);
      continue;
    }
    if (event.eventName === "session:character_added") {
      names.set(event.body.characterId, event.body.name);
      continue;
    }
    if (event.eventName === "session:character_archived") continue;
    const base = {
      id: event.eventId,
      side: event.body.side,
      speakerName: names.get(event.body.as) ?? event.body.as,
      createdAt: event.eventCreatedAt,
    };
    if (event.eventName === "session:message_posted") {
      entries.push({ kind: "message", ...base, content: event.body.content });
    } else if (event.eventName === "session:dice_rolled") {
      const { notation, terms, total, label } = event.body;
      entries.push({
        kind: "roll",
        ...base,
        notation,
        terms,
        total,
        ...(label !== undefined && { label }),
      });
    }
  }
  return entries;
}
