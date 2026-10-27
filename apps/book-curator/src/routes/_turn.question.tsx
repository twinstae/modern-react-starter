import { createFileRoute } from "@tanstack/react-router";

import { QuestionScreen } from "../components/question-screen.tsx";
import { IdleGuard } from "./-kiosk/idle.tsx";
import { KioskNotice } from "./-kiosk/notice.tsx";
import { guard, useKiosk, useKioskPage } from "./-kiosk/session.tsx";

/** 지금 질문. 몇 번째인지는 답한 수가 정한다. 마지막 답을 하면 세션이 결과로 옮긴다. */
export const Route = createFileRoute("/_turn/question")({
  beforeLoad: guard("question"),
  component: QuestionPage,
});

function QuestionPage() {
  const kiosk = useKiosk();
  const { session, redirect } = useKioskPage("question");
  if (session === null) return redirect;

  const { questions } = session.bundle.questionSet;
  const index = session.turn.answers.length;
  const question = questions[index];

  if (question === undefined || question.type === "choice") {
    return (
      <KioskNotice
        title="이 질문은 아직 준비 중이에요"
        body="문항형 질문만 보여 드릴 수 있어요. 처음으로 돌아가 주세요."
        action={{
          label: "처음으로",
          onClick: () => kiosk.dispatch({ type: "reset", reason: "manual" }),
        }}
      />
    );
  }

  return (
    <>
      <QuestionScreen
        key={index}
        questionText={question.text}
        index={index}
        total={questions.length}
        onAnswer={(value) => kiosk.dispatch({ type: "answer", value, now: Date.now() })}
        onBack={() => kiosk.dispatch({ type: "back", now: Date.now() })}
      />
      <IdleGuard lastActivityAt={session.lastActivityAt} />
    </>
  );
}
