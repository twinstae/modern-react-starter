import { VersionConflictError, type EventLogStore } from "./event-log-store.ts";
import type { SessionEvent } from "./session.ts";

/** 저장 전 묶음: 한 번의 mutation이 만든 이벤트들과 저장 상태 */
export interface SaveBatch<Meta> {
  events: SessionEvent[];
  status: "pending" | "failed";
  /** 이 묶음을 만든 제출이 `run`에 맡긴 값 */
  meta: Meta;
}

/** `run` 밖에서 `append`가 불렸다. 저장 결과가 아니라 쓰는 쪽의 실수라서 `run`이 삼키지 않는다. */
export class SaveQueueMisuseError extends Error {
  constructor() {
    super("save queue: run() 안에서 동기로 부른 append가 아닙니다");
    this.name = "SaveQueueMisuseError";
  }
}

/** `run`이 끝났을 때 그 묶음이 어떻게 되었는지 */
export type SaveOutcome = "saved" | "failed" | "conflict";

/**
 * 저장소 앞에서 저장을 한 번에 하나씩 순서대로 하게 하는 줄. UI와 ventyd 엔티티를 모른다.
 * - 묶음마다 `pending`, 실패하면 `failed`다. 충돌은 실패가 아니라 따로 알린다.
 * - 한 묶음이 실패하거나 충돌하면 `resume()`까지 멈춘다. 뒤에서 기다리던 묶음은 버전이 이어지지 않으므로
 *   저장소를 부르지 않고 `failed`로 둔다.
 */
export function createSaveQueue<Meta>({
  store,
  onChange,
  onSaved,
}: {
  store: EventLogStore;
  /** 저장 전 묶음이나 상태가 바뀔 때마다 부른다 */
  onChange: () => void;
  /** 저장소에 저장한 묶음을 알린다. 이미 `unsaved`에서 빠진 뒤다. */
  onSaved: (events: SessionEvent[]) => void;
}) {
  let unsaved: Array<SaveBatch<Meta>> = [];
  let halted = false;
  let tail: Promise<void> = Promise.resolve();
  /** `run` 안에서 동기로 부른 `append`가 쓸 값 */
  let current: { meta: Meta } | undefined;

  /** `run`이 감싸 준 저장소. 이 저장소로 부른 `append`만 줄에 선다. */
  const queuedStore: EventLogStore = {
    read: store.read,
    append(id, expectedVersion, events) {
      if (!current) {
        throw new SaveQueueMisuseError();
      }
      const batch: SaveBatch<Meta> = { events, status: "pending", meta: current.meta };
      current = undefined;
      unsaved.push(batch);
      const saving = tail.then(async () => {
        try {
          // 앞의 저장이 실패했으면 이 묶음은 버전이 이어지지 않으므로 저장하지 않는다
          if (halted) throw new Error("앞의 저장이 실패해 저장하지 않았습니다");
          await store.append(id, expectedVersion, events);
        } catch (error) {
          // 충돌은 실패가 아니라 다시 불러오는 일이라 failed로 보이지 않는다
          if (!(error instanceof VersionConflictError)) batch.status = "failed";
          halted = true;
          onChange();
          throw error;
        }
        unsaved = unsaved.filter((other) => other !== batch);
        onSaved(events);
        onChange();
      });
      tail = saving.catch(() => {});
      return saving;
    },
  };

  return {
    /** ventyd 어댑터가 쓸 저장소 */
    store: queuedStore,

    /**
     * `commit`을 부르고 그 저장이 끝나기를 기다린다. `commit`은 `store`의 `append`를 동기로 불러야 한다.
     * 그래야 `meta`가 그 묶음에 붙는다. 그렇지 않으면 `append`가 오류를 던진다.
     */
    async run(meta: Meta, commit: () => Promise<void>): Promise<SaveOutcome> {
      current = { meta };
      let saving: Promise<void>;
      try {
        saving = commit();
      } finally {
        current = undefined;
      }
      onChange();
      try {
        await saving;
        return "saved";
      } catch (error) {
        if (error instanceof SaveQueueMisuseError) throw error;
        return error instanceof VersionConflictError ? "conflict" : "failed";
      }
    },

    get unsaved(): ReadonlyArray<SaveBatch<Meta>> {
      return unsaved;
    },
    get halted() {
      return halted;
    },
    /** 저장 전 묶음을 모두 버린다. 다시 불러올 때 쓴다. */
    clear() {
      unsaved = [];
    },
    /** 저장 전 묶음을 모두 failed로 둔다. 다시 불러오지 못해 저장 여부를 알 수 없을 때 쓴다. */
    abandon() {
      for (const batch of unsaved) batch.status = "failed";
      onChange();
    },
    /** 멈춘 줄을 다시 연다. 다시 불러온 뒤에 쓴다. */
    resume() {
      halted = false;
    },
  };
}
