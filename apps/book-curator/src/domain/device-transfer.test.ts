import { describe, expect, it } from "vite-plus/test";

import {
  drawersFileOf,
  parseDrawersFile,
  recordsFileOf,
  transferFileName,
} from "./device-transfer.ts";
import { sampleFunnelEvents } from "./funnel.fixture.ts";
import { SEED_DRAWERS } from "./seed-question-set.ts";

describe("서랍 파일", () => {
  it("내보낸 파일을 다시 읽으면 같은 서랍·문항·책이다", () => {
    const text = JSON.stringify(drawersFileOf(SEED_DRAWERS));

    expect(parseDrawersFile(text)).toStrictEqual({ ok: true, drawers: SEED_DRAWERS });
  });

  it("JSON이 아니거나 다른 파일이면 무엇이 틀렸는지 알린다", () => {
    expect(parseDrawersFile("제목,저자")).toStrictEqual({
      ok: false,
      message: "JSON 파일이 아니에요",
    });
    expect(parseDrawersFile(JSON.stringify({ kind: "book-curator/records" }))).toStrictEqual({
      ok: false,
      message: "서랍 내보내기 파일이 아니에요",
    });
  });

  it("서랍 id가 겹치거나 문항이 빈 문장이면 읽지 않는다", () => {
    const [first] = SEED_DRAWERS;
    const twice = drawersFileOf([first!, { ...first!, books: [] }]);
    const blank = drawersFileOf([{ ...first!, questions: [" "] }]);

    expect(parseDrawersFile(JSON.stringify(twice))).toStrictEqual({
      ok: false,
      message: "파일 내용이 틀렸어요: 서랍 id가 겹쳐요",
    });
    expect(parseDrawersFile(JSON.stringify(blank))).toStrictEqual({
      ok: false,
      message: "파일 내용이 틀렸어요: 빈 문항은 둘 수 없어요",
    });
  });
});

describe("기록 파일", () => {
  it("별명 자리 없이 이벤트와 열쇠 건넴을 담고, 모든 행에 버전이 있다(I-12, I-16)", () => {
    const events = sampleFunnelEvents("session-1");
    const handover = { id: 1, sessionId: "session-1", version: 3, recommended: "B6", handed: "B1" };

    const file = recordsFileOf(events, [handover], "2026-11-23T09:00:00.000Z");

    expect(file).toStrictEqual({
      kind: "book-curator/records",
      format: 1,
      exportedAt: "2026-11-23T09:00:00.000Z",
      events,
      handovers: [handover],
    });
    expect(JSON.stringify(file)).not.toContain("nickname");
    expect([...file.events, ...file.handovers].every(({ version }) => version >= 1)).toBe(true);
  });

  it("파일 이름에 무엇인지와 날짜를 붙인다", () => {
    expect(transferFileName("기록", "2026-11-23T09:00:00.000Z")).toBe(
      "책방79-1-기록-2026-11-23.json",
    );
  });
});
