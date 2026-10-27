import { useMutation } from "@tanstack/react-query";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";

import { OwnerCheckScreen } from "../components/owner-check-screen.tsx";
import { curationOf, ownerCheckOf } from "../domain/kiosk-session.ts";
import type { DrawerId } from "../domain/question-set.ts";
import { OwnerTokenExpiredError, postHandover } from "../owner-api.ts";
import { guard, PATH, useKiosk, useKioskPage } from "./-kiosk/session.tsx";

/**
 * 주인 확인. 주인이 고른 서랍을 기록하면 세션이 "서랍을 열어 보세요"로 옮긴다. 추천과 달라도
 * 된다(R-7). 토큰이 끝나면 세션이 이 화면을 닫아 PIN으로 돌아간다.
 */
export const Route = createFileRoute("/_turn/owner/check")({
  beforeLoad: guard("owner-check"),
  component: OwnerCheckPage,
});

function OwnerCheckPage() {
  const kiosk = useKiosk();
  const navigate = useNavigate();
  const { session, redirect } = useKioskPage("owner-check");

  const handover = useMutation({
    mutationFn: async (handed: DrawerId) => {
      if (session === null || session.owner.status !== "unlocked") {
        throw new OwnerTokenExpiredError();
      }
      const recommended = curationOf(session)?.ranking.first;
      if (recommended === undefined) {
        throw new Error("결과를 다시 만들지 못했어요. 손님 화면으로 돌아가 주세요.");
      }
      try {
        await postHandover(session.owner.token, {
          sessionId: session.funnel.sessionId,
          version: session.funnel.version,
          recommended,
          handed,
        });
      } catch (error) {
        if (error instanceof OwnerTokenExpiredError) throw error;
        throw new Error("열쇠 건넴을 기록하지 못했어요. 잠시 뒤 다시 해 주세요.");
      }
      return handed;
    },
    onSuccess: (drawer) => kiosk.dispatch({ type: "hand_over", drawer, now: Date.now() }),
    onError: (error) => {
      if (error instanceof OwnerTokenExpiredError) kiosk.dispatch({ type: "owner_expired" });
    },
  });

  if (session === null) return redirect;

  const view = ownerCheckOf(session);
  // 결과나 서가가 어긋나 주인 확인을 그릴 수 없으면 손님 결과로 조용히 돌아간다.
  if (view === null) return <Navigate to={PATH.result} replace />;

  return (
    <OwnerCheckScreen
      view={view}
      notice={handover.isError ? handover.error.message : null}
      onHandover={(drawer) => handover.mutate(drawer)}
      onCancel={() => {
        kiosk.dispatch({ type: "lock", now: Date.now() });
        void navigate({ to: PATH.result, replace: true });
      }}
    />
  );
}
