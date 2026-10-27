import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { DrawerBooksScreen } from "../components/drawer-books-screen.tsx";
import { OwnerTokenExpiredError, postPurchase } from "../owner-api.ts";
import { guard, useKiosk, useKioskPage } from "./-kiosk/session.tsx";

/** 건넨 서랍 속 책. 산 책을 남기면 다시 부르지 않고 이 화면의 수량만 줄인다(I-11). */
export const Route = createFileRoute("/_turn/owner/books")({
  beforeLoad: guard("owner-books"),
  component: DrawerBooksPage,
});

function DrawerBooksPage() {
  const kiosk = useKiosk();
  const { session, redirect } = useKioskPage("owner-books");

  const purchase = useMutation({
    mutationFn: async (bookId: string) => {
      if (session?.handover == null || session.owner.status !== "unlocked") {
        throw new OwnerTokenExpiredError();
      }
      const quantity = await postPurchase(session.owner.token, {
        sessionId: session.funnel.sessionId,
        version: session.funnel.version,
        drawer: session.handover.drawer,
        bookId,
      });
      return { bookId, quantity };
    },
    onSuccess: ({ bookId, quantity }) =>
      kiosk.dispatch({ type: "purchase", bookId, quantity, now: Date.now() }),
    onError: (error) => {
      if (error instanceof OwnerTokenExpiredError) kiosk.dispatch({ type: "owner_expired" });
    },
  });

  if (session?.handover == null) return redirect;
  const { handover, owner } = session;
  const drawer = session.bundle.questionSet.drawers.find(({ code }) => code === handover.drawer);

  let notice: string | null = null;
  if (owner.status === "expired") notice = "주인 확인 시간이 끝나 산 책 기록은 할 수 없어요.";
  else if (purchase.isError) notice = "산 책 기록을 남기지 못했어요. 잠시 뒤 다시 해 주세요.";

  return (
    <DrawerBooksScreen
      drawer={{ name: drawer?.name ?? "", mark: drawer?.mark ?? null }}
      books={handover.books}
      canRecordPurchase={owner.status === "unlocked"}
      recordedBookIds={handover.recordedBookIds}
      notice={notice}
      onPurchase={(bookId) => purchase.mutate(bookId)}
      onFinish={() => kiosk.dispatch({ type: "reset", reason: "completed" })}
    />
  );
}
