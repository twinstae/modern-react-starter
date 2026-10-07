import { parseNotation, roll, type Random } from "./dice.ts";
import { createEventLogAdapter } from "./event-log-adapter.ts";
import { parseInput } from "./parse-input.ts";
import { toLogEntries, type EntryStatus, type LogEntry } from "./log-entries.ts";
import {
  createSessionRepository,
  DEFAULT_CHARACTERS,
  Session,
  type Character,
  RuleViolation,
  type Side,
  type SessionEvent,
} from "./session.ts";
import type { EventLogStore } from "./event-log-store.ts";
import { createSaveQueue, type SaveOutcome } from "./save-queue.ts";

/** 화면이 그리는 세션의 모습. 로그 항목은 이벤트 목록에서, 화자 목록은 세션 상태에서 온다. */
export interface SessionView {
  events: SessionEvent[];
  entries: LogEntry[];
  characters: Character[];
  /** 충돌로 버려진 제출의 글. 그 편의 입력창이 다시 채운다. */
  restored: Partial<Record<Side, RestoredInput>>;
  /** 충돌로 다시 불러왔다는 알림. 캐릭터 변경처럼 되돌려 줄 글이 없는 제출도 이것으로 알린다. 다음 제출을 받으면 사라진다. */
  notice?: string;
}

/** 충돌로 버려진 제출을 입력창에 되돌려 주는 값 */
export interface RestoredInput {
  /** 되돌려 줄 때마다 늘어난다. 입력창이 같은 값을 두 번 채우지 않게 한다. */
  key: number;
  /** 화자 캐릭터 id */
  as: string;
  /** 사용자가 친 그대로의 글 */
  text: string;
}

/** 제출한 글. 충돌로 버려지면 입력창에 돌려준다. */
interface SubmittedInput {
  side: Side;
  as: string;
  text: string;
}

const CONFLICT_NOTICE = "다른 곳에서 먼저 기록했습니다. 최신 기록을 다시 불러왔습니다";

const RELOAD_FAILED_NOTICE = "최신 기록을 불러오지 못했습니다. 다시 시도하려면 새로 기록하세요";

/** 불러오기 전의 모습 */
const EMPTY_VIEW: SessionView = { events: [], entries: [], characters: [], restored: {} };

/**
 * 세션 하나에 대한 컨트롤러. UI를 모른다. 이벤트 로그 저장소(메모리 또는 HTTP)만 받는다.
 * 세션 엔티티와 이벤트 목록을 메모리에 들고 이어 간다. 로그는 처음 불러올 때 한 번 읽고,
 * 그 뒤로는 커밋한 이벤트만 저장한다. 충돌이 났을 때만 다시 읽는다.
 */
export function createSessionController({
  sessionId,
  eventLog,
  random,
  generateId,
}: {
  sessionId: string;
  eventLog: EventLogStore;
  /** 주사위를 굴릴 난수. 도메인은 난수를 만들지 않고 앱이 넘겨 준다. */
  random: Random;
  /** 새 캐릭터의 id를 만든다. 도메인은 id를 만들지 않고 앱이 넘겨 준다. */
  generateId: () => string;
}) {
  let committed: SessionEvent[] = [];
  const adapter = createEventLogAdapter(eventLog, (events) => {
    committed = events;
  });

  const queue = createSaveQueue<SubmittedInput | undefined>({
    store: eventLog,
    onChange: () => publish(),
    onSaved: (saved) => {
      events = [...events, ...saved];
    },
  });
  const repository = createSessionRepository(createEventLogAdapter(queue.store));
  const startRepository = createSessionRepository(adapter);

  let session: Session | undefined;
  /** 저장된 이벤트 */
  let events: SessionEvent[] = [];
  let restored: SessionView["restored"] = {};
  let restoredCount = 0;
  let notice: string | undefined;
  let loading: Promise<void> | undefined;
  /** 시작한 저장과 그 뒤처리가 모두 끝나면 이루어지는 약속 */
  let settling: Promise<unknown> = Promise.resolve();

  // 바뀔 때만 새로 만든다. useSyncExternalStore는 같은 상태에 같은 스냅샷을 요구한다.
  let snapshot = EMPTY_VIEW;
  const listeners = new Set<() => void>();
  const publish = () => {
    const all = [...events, ...queue.unsaved.flatMap((batch) => batch.events)];
    const statuses = new Map<string, EntryStatus>(
      queue.unsaved.flatMap((entry) =>
        entry.events.map((event) => [event.eventId, entry.status] as const),
      ),
    );
    snapshot = {
      events: all,
      entries: toLogEntries(all, statuses),
      characters: session?.state.characters ?? [],
      restored,
      notice,
    };
    for (const listener of listeners) listener();
  };

  /** 이미 읽어 둔 이벤트로 엔티티를 되살린다. 로그를 다시 읽지 않는다. */
  const restore = (known: SessionEvent[]) =>
    createSessionRepository({ ...adapter, getEventsByEntityId: async () => known }).findOne({
      entityId: sessionId,
    });

  /** 로그를 읽어 엔티티와 목록을 새로 만든다. 로그가 비어 있으면 기본 캐릭터로 시작한다. */
  async function readLog() {
    const stored = await eventLog.read(sessionId);
    queue.clear();
    events = stored;
    session = (await restore(events)) ?? undefined;
    if (!session) {
      session = Session.create({ entityId: sessionId, body: { characters: DEFAULT_CHARACTERS } });
      await startRepository.commit(session);
      events = committed;
    }
    // 읽는 동안에는 낡은 묶음이 저장하지 못하게 멈춰 둔다. 읽은 뒤에야 새 제출을 받는다.
    queue.resume();
    publish();
  }

  /** 다시 불러오는 중이면 그 약속. 동시에 여럿이 부르면 한 번만 읽는다. */
  let reloading: Promise<void> | undefined;
  function reload() {
    if (!reloading) {
      reloading = readLog().finally(() => {
        reloading = undefined;
      });
      settling = Promise.all([settling, reloading.catch(() => {})]);
    }
    return reloading;
  }

  /** 저장이 끝난 뒤의 일. 충돌이면 서버의 로그를 다시 불러온다. 실패는 이미 failed로 화면에 있다. */
  async function afterSave(outcome: SaveOutcome) {
    if (outcome === "conflict") {
      restored = {};
      notice = CONFLICT_NOTICE;
      for (const { meta: input } of queue.unsaved) {
        if (!input) continue;
        const text = [restored[input.side]?.text, input.text]
          .filter((t) => t !== undefined)
          .join("\n");
        restored[input.side] = { key: ++restoredCount, as: input.as, text };
      }
      // 다시 불러오는 동안에도 충돌을 바로 알린다
      publish();
      try {
        await reload();
      } catch {
        // 다시 불러오지 못했다. 줄은 멈춘 채로 두어 다음 제출이 다시 시도한다.
        queue.abandon();
        notice = RELOAD_FAILED_NOTICE;
        publish();
      }
    }
  }

  /**
   * 엔티티에 일을 시키고 곧바로 화면에 반영한 뒤 저장을 시작한다. 저장을 기다리지 않는다.
   * 규칙 위반이면 사용자에게 보여 줄 오류 메시지를 돌려주고, 아니면 undefined다.
   */
  async function apply(
    record: (current: Session) => void,
    input?: SubmittedInput,
  ): Promise<string | undefined> {
    // 저장이 실패한 뒤의 첫 제출은 서버의 로그를 다시 불러온 위에서 받는다. 실패한 기록은 여기서 사라진다.
    if (queue.halted) {
      await settling;
      if (queue.halted) {
        try {
          await reload();
        } catch {
          return RELOAD_FAILED_NOTICE;
        }
      }
    }
    if (!session) return "아직 시작되지 않은 세션입니다";
    try {
      record(session);
    } catch (error) {
      if (error instanceof RuleViolation) return error.message;
      throw error;
    }
    notice = undefined;
    const current = session;
    const saving = queue.run(input, () => repository.commit(current));
    settling = Promise.all([settling, saving.then(afterSave)]);
    return undefined;
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    getSnapshot: (): SessionView => snapshot,

    /** 시작한 저장이 모두 끝날 때까지 기다린다. 테스트와 화면을 떠날 때 쓴다. */
    idle: async () => {
      // 기다리는 동안 새로 시작한 일(다시 불러온 뒤 받아들인 제출의 저장)까지 기다린다
      let waited: Promise<unknown>;
      do {
        waited = settling;
        await waited;
      } while (waited !== settling);
    },

    /** 처음 한 번만 로그를 읽는다. 이미 불러왔으면 메모리의 모습을 돌려준다. */
    load(): Promise<SessionView> {
      loading ??= readLog().catch((error) => {
        // 실패한 불러오기를 기억하지 않아, 다음 load()가 다시 시도한다
        loading = undefined;
        throw error;
      });
      return loading.then(() => snapshot);
    },

    /**
     * 입력창에 친 글을 해석해 대화나 판정으로 남긴다.
     * 잘못된 입력이나 규칙 위반이면 사용자에게 보여 줄 오류 메시지를 돌려주고, 아니면 undefined다.
     * 저장은 기다리지 않는다. 저장 중, 실패, 충돌은 `getSnapshot()`으로 알린다.
     */
    async submit({
      side,
      as,
      text,
    }: {
      side: Side;
      as: string;
      text: string;
    }): Promise<string | undefined> {
      const input = parseInput(text);
      if (input.type === "error") return input.message;
      let record: (current: Session) => void;
      if (input.type === "message") {
        record = (current) => current.postMessage(side, as, input.content);
      } else {
        const notation = parseNotation(input.notation);
        if (!notation.ok) return notation.message;
        const result = roll(notation.terms, random);
        record = (current) => current.rollDice(side, as, input.notation, result, input.label);
      }
      return apply(record, { side, as, text });
    },

    /** 캐릭터를 추가한다. 이름 규칙을 어기면 오류 메시지를 돌려주고, 아니면 undefined다. */
    addCharacter: async ({ name }: { name: string }): Promise<string | undefined> =>
      apply((current) => current.addCharacter(generateId(), name)),

    /** 캐릭터를 보관한다. 규칙을 어기면 오류 메시지를 돌려주고, 아니면 undefined다. */
    archiveCharacter: async (characterId: string): Promise<string | undefined> =>
      apply((current) => current.archiveCharacter(characterId)),
  };
}
