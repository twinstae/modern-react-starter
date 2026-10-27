import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { OwnerPinScreen } from "../components/owner-pin-screen.tsx";
import { unlockOwner } from "../owner-api.ts";
import { guard, PATH, useKiosk, useKioskPage } from "./-kiosk/session.tsx";

/** 주인 PIN. 풀리면 주인 확인으로, 그만두면 결과로 돌아간다. */
export const Route = createFileRoute("/_turn/owner/pin")({
  beforeLoad: guard("owner-pin"),
  component: OwnerPinPage,
});

function OwnerPinPage() {
  const kiosk = useKiosk();
  const navigate = useNavigate();
  const { session, redirect } = useKioskPage("owner-pin");
  if (session === null) return redirect;

  return (
    <OwnerPinScreen
      notice={
        session.owner.status === "expired"
          ? "주인 확인 시간이 끝났어요. PIN을 다시 넣어 주세요."
          : null
      }
      onUnlock={async (pin) => {
        const result = await unlockOwner(pin);
        if (!result.ok) return result.message;
        kiosk.dispatch({ type: "unlock", owner: result.unlock, now: Date.now() });
        await navigate({ to: PATH["owner-check"], replace: true });
        return undefined;
      }}
      onCancel={() => {
        kiosk.dispatch({ type: "lock", now: Date.now() });
        void navigate({ to: PATH.result, replace: true });
      }}
    />
  );
}
