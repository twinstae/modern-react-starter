import * as v from "valibot";

import { DrawerSchema, toDrawerDto, type Drawer } from "./drawer.ts";
import { FunnelEventSchema, toFunnelEventDto, type FunnelEvent } from "./funnel.ts";
import { HandoverRecordSchema, toHandoverRecordDto, type HandoverRecord } from "./owner-record.ts";

/**
 * 태블릿 밖으로 옮기는 파일. 서버가 없으니 다른 태블릿으로 옮기거나 백업하는 길은 이 파일뿐이다.
 * `kind`로 무슨 파일인지 가리고, `format`으로 모양이 바뀌었을 때를 대비한다.
 */
const allDifferent = (values: readonly string[]) => new Set(values).size === values.length;

export const DrawersFileSchema = v.strictObject({
  kind: v.literal("book-curator/drawers"),
  format: v.literal(1),
  drawers: v.pipe(
    v.array(DrawerSchema),
    v.check((drawers) => allDifferent(drawers.map(({ id }) => id)), "서랍 id가 겹쳐요"),
    v.check(
      (drawers) => allDifferent(drawers.flatMap(({ books }) => books.map(({ id }) => id))),
      "책 id가 겹쳐요",
    ),
  ),
});

export type DrawersFile = v.InferOutput<typeof DrawersFileSchema>;

export function drawersFileOf(drawers: readonly Drawer[]): DrawersFile {
  return { kind: "book-curator/drawers", format: 1, drawers: drawers.map(toDrawerDto) };
}

export type DrawersFileResult =
  | { readonly ok: true; readonly drawers: readonly Drawer[] }
  | { readonly ok: false; readonly message: string };

/** 가져올 서랍 파일을 읽는다. 한 곳이라도 틀리면 아무것도 돌려주지 않고 까닭만 알린다. */
export function parseDrawersFile(text: string): DrawersFileResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, message: "JSON 파일이 아니에요" };
  }
  const parsed = v.safeParse(DrawersFileSchema, json);
  if (parsed.success) return { ok: true, drawers: parsed.output.drawers };
  const kind = v.safeParse(v.object({ kind: v.literal("book-curator/drawers") }), json);
  if (!kind.success) return { ok: false, message: "서랍 내보내기 파일이 아니에요" };
  return { ok: false, message: `파일 내용이 틀렸어요: ${parsed.issues[0].message}` };
}

/**
 * 이 태블릿에 쌓인 기록. 퍼널 이벤트와 열쇠 건넴을 그대로 담는다. 둘 다 별명 자리가 없고
 * 모든 행에 버전이 있다(I-12, I-16). 세션 ID로 이어 학습 데이터를 만든다(TICKET-00013).
 */
export const RecordsFileSchema = v.strictObject({
  kind: v.literal("book-curator/records"),
  format: v.literal(1),
  exportedAt: v.string(),
  events: v.array(FunnelEventSchema),
  handovers: v.array(HandoverRecordSchema),
});

export type RecordsFile = v.InferOutput<typeof RecordsFileSchema>;

export function recordsFileOf(
  events: readonly FunnelEvent[],
  handovers: readonly HandoverRecord[],
  exportedAt: string,
): RecordsFile {
  return {
    kind: "book-curator/records",
    format: 1,
    exportedAt,
    events: events.map(toFunnelEventDto),
    handovers: handovers.map(toHandoverRecordDto),
  };
}

/** 내려받는 파일 이름. 날짜를 붙여 여러 번 받아도 겹치지 않게 한다. */
export const transferFileName = (what: "서랍" | "기록", now: string): string =>
  `책방79-1-${what}-${now.slice(0, 10)}.json`;
