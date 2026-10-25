import type { Health } from "../domain/health.ts";

export interface HealthDeps {
  /** 현재 시각 ISO 문자열. 코어는 Date.now를 직접 부르지 않는다. */
  now: () => string;
}

/** 서버가 살아 있음을 알리고, 확인한 시각을 함께 남긴다. */
export function checkHealth({ now }: HealthDeps): Health {
  return { status: "ok", checkedAt: now() };
}
