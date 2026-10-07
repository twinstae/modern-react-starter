import { createEventLogAdapter } from "./event-log-adapter.ts";
import {
  createSessionRepository,
  DEFAULT_CHARACTERS,
  Session,
  type Character,
  RuleViolation,
  type Side,
  type SessionEvent,
} from "./session.ts";
import { VersionConflictError, type EventLogStore } from "../server/event-log-store.ts";

/** 화면이 그리는 세션의 모습. 로그는 이벤트 목록 그대로, 화자 목록은 세션 상태에서 온다. */
export interface SessionView {
  events: SessionEvent[];
  characters: Character[];
}

/**
 * 세션 하나에 대한 컨트롤러. UI를 모른다. 이벤트 로그 저장소(메모리 또는 HTTP)만 받아
 * 불러오기와 시작, 제출을 맡는다.
 */
export function createSessionController({
  sessionId,
  eventLog,
}: {
  sessionId: string;
  eventLog: EventLogStore;
}) {
  const repository = createSessionRepository(createEventLogAdapter(eventLog));

  return {
    /** 로그가 비어 있으면 아직 시작되지 않은 세션이므로 기본 캐릭터로 시작한다. */
    async load(): Promise<SessionView> {
      let session = await repository.findOne({ entityId: sessionId });
      if (!session) {
        session = Session.create({ entityId: sessionId, body: { characters: DEFAULT_CHARACTERS } });
        await repository.commit(session);
      }
      return { events: await eventLog.read(sessionId), characters: session.state.characters };
    },

    /** 대화를 남긴다. 규칙 위반이나 충돌이면 사용자에게 보여 줄 오류 메시지를 돌려주고, 성공하면 undefined다. */
    async submit({
      side,
      as,
      text,
    }: {
      side: Side;
      as: string;
      text: string;
    }): Promise<string | undefined> {
      const session = await repository.findOne({ entityId: sessionId });
      if (!session) return "아직 시작되지 않은 세션입니다";
      try {
        session.postMessage(side, as, text);
        await repository.commit(session);
      } catch (error) {
        if (error instanceof RuleViolation) return error.message;
        if (error instanceof VersionConflictError) {
          return "다른 곳에서 먼저 기록했습니다. 최신 기록을 다시 불러왔습니다";
        }
        throw error;
      }
    },
  };
}
