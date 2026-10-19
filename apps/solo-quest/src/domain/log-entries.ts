import type { RolledCheck, RolledTerm } from "./dice.ts";
import type { Side, SessionEvent } from "./session.ts";

/** 저장된 기록인지, 저장을 기다리는 중인지, 저장하지 못했는지 */
export type EntryStatus = "committed" | "pending" | "failed";

/** 어느 항목이든 가진 값 */
interface BaseEntry {
  id: string;
  status: EntryStatus;
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

export interface OracleEntry extends BaseEntry {
  kind: "oracle";
  /** 굴린 전역 오라클 */
  oracleId: string;
  oracleName: string;
  /** 굴린 주사위의 면 수 */
  sides: number;
  /** 나온 눈 */
  value: number;
  /** 눈에 드는 줄의 결과 */
  result: string;
  /** 결과 밑에 회색 글씨로 보이는 짧은 설명. 그 줄이 가지고 있었을 때만 있다. */
  description?: string;
  /** 결과에서 건너갈 바깥 주소. 그 줄이 가지고 있었을 때만 있다. */
  url?: string;
}

export interface RollEntry extends BaseEntry {
  kind: "roll";
  /** 입력한 그대로의 표기 */
  notation: string;
  terms: RolledTerm[];
  total: number;
  /** 비교 판정이면 있다. `terms`, `total`은 액션 쪽이다. */
  check?: RolledCheck;
  label?: string;
  /** 매크로가 붙인 결과 이름 */
  outcome?: string;
  /** 매크로가 붙인 눈 효과 */
  effect?: string;
}

/** 로그 화면이 그리는 항목 하나. 이벤트에서 만든 표시용 값이다. */
export type LogEntry = MessageEntry | RollEntry | OracleEntry;

/**
 * 이벤트 로그를 화면 항목으로 바꾼다. 화자 이름은 시작할 때 넘겨받았거나 나중에 추가한 캐릭터에서
 * id로 찾는다. 보관해도 이름은 남으므로 보관된 캐릭터의 지난 기록도 이름이 그대로 보인다.
 */
export function toLogEntries(
  events: SessionEvent[],
  /** 저장되지 않은 이벤트의 상태. 여기 없는 이벤트는 저장된 것이다. */
  unsaved: ReadonlyMap<string, EntryStatus> = new Map(),
): LogEntry[] {
  const names = new Map<string, string>();
  const entries: LogEntry[] = [];
  const baseOf = (event: Extract<SessionEvent, { body: { side: Side; as: string } }>) => ({
    id: event.eventId,
    status: unsaved.get(event.eventId) ?? "committed",
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
      case "session:macro_added":
      case "session:macro_removed":
      case "session:oracle_macro_added":
      case "session:oracle_macro_removed":
        // 매크로와 오라클 등록은 굴릴 때 쓰는 세션 상태라 로그에 보이지 않는다
        break;
      case "session:oracle_rolled": {
        const { oracleId, oracleName, sides, value, result, description, url } = event.body;
        entries.push({
          kind: "oracle",
          ...baseOf(event),
          oracleId,
          oracleName,
          sides,
          value,
          result,
          ...(description !== undefined && { description }),
          ...(url !== undefined && { url }),
        });
        break;
      }
      case "session:message_posted":
        entries.push({ kind: "message", ...baseOf(event), content: event.body.content });
        break;
      case "session:dice_rolled": {
        const { notation, terms, total, check, label, outcome, effect } = event.body;
        entries.push({
          kind: "roll",
          ...baseOf(event),
          notation,
          terms,
          total,
          ...(check !== undefined && { check }),
          ...(label !== undefined && { label }),
          ...(outcome !== undefined && { outcome }),
          ...(effect !== undefined && { effect }),
        });
        break;
      }
      default:
        event satisfies never;
    }
  }
  return entries;
}
