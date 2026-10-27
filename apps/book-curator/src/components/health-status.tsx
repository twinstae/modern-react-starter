import type { Health } from "../domain/health.ts";
import { MutedText } from "../ui/index.ts";

/** 서버가 돌려준 health 응답을 그대로 보여 준다. */
export function HealthStatus({ health }: { health: Health }) {
  return (
    <MutedText role="status" aria-label="서버 상태" px="4" py="3" borderRadius="l2" bg="gray.3">
      서버 상태: {health.status} · 확인 {health.checkedAt}
    </MutedText>
  );
}
