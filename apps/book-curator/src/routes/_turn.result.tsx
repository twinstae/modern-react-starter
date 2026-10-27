import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { ResultScreen } from "../components/result-screen.tsx";
import { curationOf } from "../domain/kiosk-session.ts";
import { IdleGuard } from "./-kiosk/idle.tsx";
import { KioskNotice } from "./-kiosk/notice.tsx";
import { guard, PATH, useKiosk, useKioskPage } from "./-kiosk/session.tsx";

/** 손님 결과. 주인 확인은 PIN 화면으로 가는 길이다. */
export const Route = createFileRoute("/_turn/result")({
  beforeLoad: guard("result"),
  component: ResultPage,
});

function ResultPage() {
  const kiosk = useKiosk();
  const navigate = useNavigate();
  const { session, redirect } = useKioskPage("result");
  if (session === null) return redirect;

  const curation = curationOf(session);
  if (curation === null) {
    return (
      <KioskNotice
        title="결과를 만들지 못했어요"
        body="다시 답하면 결과를 만들 수 있어요."
        action={{
          label: "다시 하기",
          onClick: () => kiosk.dispatch({ type: "reset", reason: "manual" }),
        }}
      />
    );
  }

  return (
    <>
      <ResultScreen
        customer={curation.customer}
        similar={curation.ranking.similar}
        onOwnerCheck={() => {
          kiosk.dispatch({ type: "lock", now: Date.now() });
          void navigate({ to: PATH["owner-pin"], replace: true });
        }}
        onRetake={() => kiosk.dispatch({ type: "reset", reason: "completed" })}
      />
      <IdleGuard lastActivityAt={session.lastActivityAt} />
    </>
  );
}
