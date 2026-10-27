import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { useWakeLock } from "../lib/use-wake-lock.ts";

/** 손님 차례 중의 화면들. 차례가 없으면 처음으로 보내고, 차례 동안 화면이 꺼지지 않게 한다. */
export const Route = createFileRoute("/_turn")({
  beforeLoad: ({ context }) => {
    if (context.kiosk.session().status !== "turn") throw redirect({ to: "/", replace: true });
  },
  component: TurnLayout,
});

function TurnLayout() {
  useWakeLock(true);
  return <Outlet />;
}
