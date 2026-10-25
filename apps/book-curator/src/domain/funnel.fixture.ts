import { type FunnelEvent, parseFunnelEvent } from "./funnel.ts";

export const FIXTURE_KIOSK_NAME = "계산대 옆";
export const FIXTURE_VERSION = 7;

const event = (value: unknown): FunnelEvent => parseFunnelEvent(value);

/** 저장소·API 테스트가 함께 쓰는 한 세션의 짧은 이벤트 묶음. */
export function sampleFunnelEvents(sessionId = "session-1"): FunnelEvent[] {
  const common = {
    sessionId,
    kioskName: FIXTURE_KIOSK_NAME,
    version: FIXTURE_VERSION,
  };

  return [
    event({ ...common, type: "kiosk_ready" }),
    event({ ...common, type: "test_start" }),
    event({
      ...common,
      type: "question_answer",
      questionId: "q1",
      answer: 5,
      questionIndex: 0,
    }),
    event({ ...common, type: "reset", reason: "manual" }),
  ];
}

/** 세션 구분이 있는 저장소 계약용 이벤트. */
export function sampleFunnelEventOf(
  sessionId: string,
  type: "kiosk_ready" | "test_start",
): FunnelEvent {
  return event({
    sessionId,
    kioskName: FIXTURE_KIOSK_NAME,
    version: FIXTURE_VERSION,
    type,
  });
}
