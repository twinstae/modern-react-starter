import { styled } from "styled-system/jsx";

import type { Health } from "../domain/health.ts";

const Status = styled("p", {
  base: { px: "4", py: "3", borderRadius: "l2", bg: "gray.3", color: "fg.muted" },
});

/** 서버가 돌려준 health 응답을 그대로 보여 준다. */
export function HealthStatus({ health }: { health: Health }) {
  return (
    <Status role="status" aria-label="서버 상태">
      서버 상태: {health.status} · 확인 {health.checkedAt}
    </Status>
  );
}
