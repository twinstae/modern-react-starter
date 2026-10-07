import { createEventLogAdapter } from "./event-log-adapter.ts";
import {
  createSessionRepository,
  DEFAULT_CHARACTERS,
  Session,
  type Character,
  type SessionEvent,
} from "./session.ts";
import type { EventLogStore } from "../server/event-log-store.ts";

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
  };
}
