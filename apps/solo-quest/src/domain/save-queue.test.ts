import { describe, expect, it } from "vitest";

import { createFakeEventLog } from "./event-log-store.fake.ts";
import { createSaveQueue, SaveQueueMisuseError } from "./save-queue.ts";
import { postedEvent, startedEvent } from "./session.fixture.ts";
import type { SessionEvent } from "./session.ts";

/** 저장소에 이미 시작 이벤트가 하나 있는 줄. 저장에 성공한 이벤트는 saved에 모인다. */
async function setup() {
  const log = createFakeEventLog();
  await log.otherTab.append("s-1", 0, [startedEvent("s-1")]);
  const saved: SessionEvent[] = [];
  let changes = 0;
  const queue = createSaveQueue<string>({
    store: log.store,
    onChange: () => (changes += 1),
    onSaved: (events) => saved.push(...events),
  });
  /** 이어지는 버전의 대화를 저장 줄에 맡긴다. 버전은 이미 맡긴 것 다음이다. */
  let version = 1;
  const post = (meta: string) => {
    const event = postedEvent("s-1", ++version, meta);
    return queue.run(meta, () => queue.store.append("s-1", version - 1, [event]));
  };
  return { log, queue, saved, post, changes: () => changes };
}

const statuses = (queue: Awaited<ReturnType<typeof setup>>["queue"]) =>
  queue.unsaved.map((batch) => batch.status);

describe("저장 줄", () => {
  it("맡긴 묶음은 저장되기 전까지 pending이고, 저장되면 줄에서 빠져 onSaved로 알린다", async () => {
    const { log, queue, saved, post } = await setup();
    log.hold();

    const outcome = post("첫째");
    expect(statuses(queue)).toStrictEqual(["pending"]);
    log.releaseNext();

    expect(await outcome).toBe("saved");
    expect(statuses(queue)).toStrictEqual([]);
    expect(saved.map((event) => event.body)).toStrictEqual([
      { side: "master", as: "gm", content: "첫째" },
    ]);
  });

  it("묶음에는 맡긴 제출의 값(meta)이 붙는다", async () => {
    const { log, queue, post } = await setup();
    log.hold();

    const outcomes = [post("첫째"), post("둘째")];

    expect(queue.unsaved.map((batch) => batch.meta)).toStrictEqual(["첫째", "둘째"]);
    log.releaseNext();
    log.releaseNext();
    await Promise.all(outcomes);
  });

  it("여러 묶음은 하나씩 순서대로 저장된다", async () => {
    const { log, post, saved } = await setup();
    log.hold();

    const outcomes = ["첫째", "둘째", "셋째"].map(post);
    log.releaseNext();
    log.releaseNext();
    log.releaseNext();

    expect(await Promise.all(outcomes)).toStrictEqual(["saved", "saved", "saved"]);
    expect(log.mostAtOnce).toBe(1);
    expect(saved.map((event) => event.version)).toStrictEqual([2, 3, 4]);
  });

  it("저장이 실패하면 그 묶음은 failed이고, 뒤에서 기다리던 묶음은 저장소를 부르지 않고 failed가 된다", async () => {
    const { log, queue, post } = await setup();
    log.hold();
    log.failNext(new Error("네트워크 오류"));

    const outcomes = ["첫째", "둘째", "셋째"].map(post);
    log.releaseNext();
    log.releaseNext();
    log.releaseNext();

    expect(await Promise.all(outcomes)).toStrictEqual(["failed", "failed", "failed"]);
    expect(statuses(queue)).toStrictEqual(["failed", "failed", "failed"]);
    expect(queue.halted).toBe(true);
    expect(await log.otherTab.read("s-1")).toHaveLength(1);
  });

  it("충돌은 실패와 따로 알리고, 그 묶음은 failed로 바꾸지 않으며, 줄은 멈춘다", async () => {
    const { log, queue, post } = await setup();
    await log.otherTab.append("s-1", 1, [postedEvent("s-1", 2, "다른 탭")]);

    const outcome = await post("내 기록");

    expect(outcome).toBe("conflict");
    expect(statuses(queue)).toStrictEqual(["pending"]);
    expect(queue.halted).toBe(true);
  });

  it("멈춘 줄은 clear와 resume 뒤에 다시 저장한다", async () => {
    const { log, queue, post, saved } = await setup();
    log.failNext(new Error("네트워크 오류"));
    await post("실패");

    queue.clear();
    queue.resume();
    expect(queue.unsaved).toStrictEqual([]);
    expect(queue.halted).toBe(false);

    // 버전 2는 실패한 묶음이 쓰려던 자리다. 저장소에는 없으므로 같은 자리에 쓴다.
    const event = postedEvent("s-1", 2, "다시");
    expect(await queue.run("다시", () => queue.store.append("s-1", 1, [event]))).toBe("saved");
    expect(saved).toStrictEqual([event]);
  });

  it("run 밖에서 append를 부르면 쓰는 쪽의 실수로 보고 던지고, run도 삼키지 않는다", async () => {
    const { queue } = await setup();

    expect(() => queue.store.append("s-1", 1, [])).toThrow(SaveQueueMisuseError);
    // append를 동기로 부르지 않는 commit
    await expect(
      queue.run("늦게", async () => {
        await Promise.resolve();
        await queue.store.append("s-1", 1, []);
      }),
    ).rejects.toThrow(SaveQueueMisuseError);
  });

  it("묶음이 늘거나 상태가 바뀔 때마다 onChange로 알린다", async () => {
    const { log, post, changes } = await setup();
    log.hold();

    const outcome = post("첫째");
    const afterRun = changes();
    log.releaseNext();
    await outcome;

    expect(afterRun).toBe(1);
    expect(changes()).toBe(2);
  });
});
