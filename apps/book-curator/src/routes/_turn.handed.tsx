import { createFileRoute } from "@tanstack/react-router";

import { IdleGuard } from "./-kiosk/idle.tsx";
import { KioskNotice } from "./-kiosk/notice.tsx";
import { guard, useKiosk, useKioskPage } from "./-kiosk/session.tsx";

/** 열쇠를 건넨 뒤. 손님은 실제 서랍을 열어 책을 보고, 태블릿은 다음 손님을 기다린다. */
export const Route = createFileRoute("/_turn/handed")({
  beforeLoad: guard("handed"),
  component: HandedPage,
});

function HandedPage() {
  const kiosk = useKiosk();
  const { session, redirect } = useKioskPage("handed");
  if (session?.handover == null) return redirect;

  const { drawer } = session.handover;
  const name = session.bundle.questionSet.drawers.find(({ id }) => id === drawer)?.name;

  return (
    <>
      <KioskNotice
        title={name === undefined ? "서랍을 열어 보세요" : `${name} 서랍을 열어 보세요`}
        body="받은 열쇠로 서랍을 열고 천천히 책을 구경해 보세요."
        action={{
          label: "처음으로",
          onClick: () => kiosk.dispatch({ type: "reset", reason: "completed" }),
        }}
      />
      <IdleGuard lastActivityAt={session.lastActivityAt} />
    </>
  );
}
