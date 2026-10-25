/** 유휴 시간 기준. 차례를 시작하고 마지막으로 만진 뒤 흐른 시간으로만 판단한다. */
export interface IdleLimits {
  readonly promptAfterMs: number;
  readonly expireAfterMs: number;
}

/**
 * 90초 조용하면 한 번 물어보고, 120초가 되면 차례를 끝낸다.
 * 태블릿 앞 손님이 문항을 읽는 시간은 넉넉히 두되, 다음 손님을 오래 기다리게 하지 않는다.
 */
export const IDLE_LIMITS: IdleLimits = {
  promptAfterMs: 90_000,
  expireAfterMs: 120_000,
};

export type IdleState = "active" | "prompt" | "expired";

/**
 * 마지막 활동 시각과 지금 시각으로 유휴 상태를 정한다. 순수 함수라 시각을 인자로 받는다.
 * 활동이 있으면 호출하는 쪽이 `lastActivityAt`을 지금 시각으로 바꿔 초기화한다.
 */
export function idleState(
  lastActivityAt: number,
  now: number,
  limits: IdleLimits = IDLE_LIMITS,
): IdleState {
  const elapsed = now - lastActivityAt;
  if (elapsed < limits.promptAfterMs) return "active";
  if (elapsed < limits.expireAfterMs) return "prompt";
  return "expired";
}
