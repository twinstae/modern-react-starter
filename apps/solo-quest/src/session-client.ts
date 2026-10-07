import { api } from "./api-client.ts";
import { createSessionController } from "./domain/session-controller.ts";
import { createHttpEventLog } from "./http-event-log.ts";

/** 브라우저에서 세션 하나를 다루는 컨트롤러. 이벤트 로그는 HTTP 이벤트 API를 거친다. */
export const sessionController = (sessionId: string) =>
  createSessionController({ sessionId, eventLog: createHttpEventLog(api) });
