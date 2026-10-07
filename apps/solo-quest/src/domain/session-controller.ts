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
import { VersionConflictError, type EventLogStore } from "./event-log-store.ts";

/** 화면이 그리는 세션의 모습. 로그는 이벤트 목록 그대로, 화자 목록은 세션 상태에서 온다. */
export interface SessionView {
  events: SessionEvent[];
  characters: Character[];
}

/**
 * 세션 하나에 대한 컨트롤러. UI를 모른다. 이벤트 로그 저장소(메모리 또는 HTTP)만 받는다.
 * 세션 엔티티와 이벤트 목록을 메모리에 들고 이어 간다. 로그는 처음 불러올 때 한 번 읽고,
 * 그 뒤로는 커밋한 이벤트만 저장한다. 충돌이 났을 때만 다시 읽는다.
 */
export function createSessionController({
  sessionId,
  eventLog,
}: {
  sessionId: string;
  eventLog: EventLogStore;
}) {
  let committed: SessionEvent[] = [];
  const adapter = createEventLogAdapter(eventLog, (events) => {
    committed = events;
  });
  const repository = createSessionRepository(adapter);

  let session: Session | undefined;
  let events: SessionEvent[] = [];
  let loading: Promise<void> | undefined;

  const view = (): SessionView => ({ events, characters: session?.state.characters ?? [] });

  /** 이미 읽어 둔 이벤트로 엔티티를 되살린다. 로그를 다시 읽지 않는다. */
  const restore = (known: SessionEvent[]) =>
    createSessionRepository({ ...adapter, getEventsByEntityId: async () => known }).findOne({
      entityId: sessionId,
    });

  /** 로그를 읽어 엔티티와 목록을 새로 만든다. 로그가 비어 있으면 기본 캐릭터로 시작한다. */
  async function readLog() {
    events = await eventLog.read(sessionId);
    session = (await restore(events)) ?? undefined;
    if (!session) {
      session = Session.create({ entityId: sessionId, body: { characters: DEFAULT_CHARACTERS } });
      await repository.commit(session);
      events = committed;
    }
  }

  return {
    /** 처음 한 번만 로그를 읽는다. 이미 불러왔으면 메모리의 모습을 돌려준다. */
    load(): Promise<SessionView> {
      loading ??= readLog().catch((error) => {
        // 실패한 불러오기를 기억하지 않아, 다음 load()가 다시 시도한다
        loading = undefined;
        throw error;
      });
      return loading.then(view);
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
      if (!session) return "아직 시작되지 않은 세션입니다";
      try {
        session.postMessage(side, as, text);
        await repository.commit(session);
        events = [...events, ...committed];
      } catch (error) {
        if (error instanceof RuleViolation) return error.message;
        if (error instanceof VersionConflictError) {
          await readLog();
          return "다른 곳에서 먼저 기록했습니다. 최신 기록을 다시 불러왔습니다";
        }
        // 저장하지 못한 이벤트가 엔티티 큐에 남지 않게 메모리의 목록으로 되돌린다
        session = (await restore(events)) ?? undefined;
        throw error;
      }
    },
  };
}
