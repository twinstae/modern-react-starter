import { Navigate, redirect, useRouteContext } from "@tanstack/react-router";
import { useAtomValue } from "jotai";

import { redirectFor, type KioskPage, type KioskSession } from "../../domain/kiosk-session.ts";
import { kioskSessionAtom } from "../../kiosk-store.ts";

/** 키오스크 화면마다의 URL. 화면은 URL이 정하고, 세션은 그 URL에 있을 수 있는지만 정한다. */
export const PATH = {
  start: "/",
  question: "/question",
  result: "/result",
  "owner-pin": "/owner/pin",
  "owner-check": "/owner/check",
  handed: "/handed",
} as const satisfies Record<KioskPage, string>;

/**
 * 라우트 guard. 세션이 이 화면을 허락하지 않으면 있어야 할 화면으로 보낸다.
 * 공용 태블릿이라 뒤로 가기 기록을 남기지 않는다(R-4).
 */
export const guard =
  (page: KioskPage) =>
  ({ context }: { context: { kiosk: { session: () => KioskSession } } }) => {
    const to = redirectFor(context.kiosk.session(), page);
    if (to !== null) throw redirect({ to: PATH[to], replace: true });
  };

type TurnSession = Extract<KioskSession, { status: "turn" }>;

/**
 * 화면에 머무는 동안 세션이 바뀌면(답을 다 함, 처음으로, 토큰 만료) 그 화면에 있을 수
 * 없게 된다. 그때는 `redirect`를 그려 세션이 있어야 할 화면으로 옮긴다.
 */
export function useKioskPage(
  page: Exclude<KioskPage, "start">,
): { session: TurnSession; redirect: null } | { session: null; redirect: React.ReactNode } {
  const session = useAtomValue(kioskSessionAtom);
  const to = redirectFor(session, page);
  if (to === null && session.status === "turn") return { session, redirect: null };
  return { session: null, redirect: <Navigate to={PATH[to ?? "start"]} replace /> };
}

export function useKiosk() {
  return useRouteContext({ from: "__root__" }).kiosk;
}
