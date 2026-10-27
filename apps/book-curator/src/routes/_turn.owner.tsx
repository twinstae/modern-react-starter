import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { useEffect } from "react";

import { kioskSessionAtom } from "../kiosk-store.ts";
import { useKiosk } from "./-kiosk/session.tsx";

/**
 * 주인 화면들. 손님 유휴 타이머 대신 주인 토큰 만료 시각에 맞춰 한 번 깨워 잠근다.
 * 잠기면 확인 화면은 PIN으로 돌아가고, 서랍 속 책 화면은 남되 기록만 막힌다.
 */
export const Route = createFileRoute("/_turn/owner")({
  component: OwnerLayout,
});

function OwnerLayout() {
  const kiosk = useKiosk();
  const session = useAtomValue(kioskSessionAtom);
  const expiresAt =
    session.status === "turn" && session.owner.status === "unlocked"
      ? session.owner.expiresAt
      : null;

  useEffect(() => {
    if (expiresAt === null) return;
    const expire = () => kiosk.dispatch({ type: "owner_expired" });
    const remaining = Date.parse(expiresAt) - Date.now();
    if (!Number.isFinite(remaining) || remaining <= 0) {
      expire();
      return;
    }
    const timer = window.setTimeout(expire, remaining);
    return () => window.clearTimeout(timer);
  }, [expiresAt, kiosk]);

  return <Outlet />;
}
