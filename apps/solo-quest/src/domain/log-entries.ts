import type { RolledTerm } from "./dice.ts";
import type { Side, SessionEvent } from "./session.ts";

/** 어느 항목이든 가진 값 */
interface BaseEntry {
  id: string;
  side: Side;
  /** 화자 캐릭터 id. 이름이 같은 다른 캐릭터와 구분한다. */
  speakerId: string;
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
  const baseOf = (event: Extract<SessionEvent, { body: { side: Side; as: string } }>) => ({
    id: event.eventId,
    side: event.body.side,
    speakerId: event.body.as,
    speakerName: names.get(event.body.as) ?? event.body.as,
    createdAt: event.eventCreatedAt,
  });
  for (const event of events) {
    // 이벤트를 새로 정의하면 여기서 어떻게 보일지 정하기 전까지 타입 검사가 실패한다.
    switch (event.eventName) {
      case "session:started":
        for (const character of event.body.characters) names.set(character.id, character.name);
        break;
      case "session:character_added":
        names.set(event.body.characterId, event.body.name);
        break;
      case "session:character_archived":
        // 보관해도 이름은 남아 지난 기록에 그대로 보인다
        break;
      case "session:message_posted":
        entries.push({ kind: "message", ...baseOf(event), content: event.body.content });
        break;
      case "session:dice_rolled": {
        const { notation, terms, total, label } = event.body;
        entries.push({
          kind: "roll",
          ...baseOf(event),
          notation,
          terms,
          total,
          ...(label !== undefined && { label }),
        });
        break;
      }
      default:
        event satisfies never;
    }
  }
  return entries;
}
