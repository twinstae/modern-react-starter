import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { NicknameStart } from "../components/nickname-start.tsx";
import { kioskQueries } from "../queries.ts";
import { KioskNotice } from "./-kiosk/notice.tsx";
import { guard, useKiosk } from "./-kiosk/session.tsx";

const KIOSK_NAME = (() => {
  const configured: unknown = import.meta.env.VITE_KIOSK_NAME;
  if (typeof configured !== "string") return "계산대 옆";
  const trimmed = configured.trim();
  return trimmed === "" ? "계산대 옆" : trimmed;
})();

/** 처음 화면. 들어올 때마다 새 묶음을 받고, 세션을 열 때 그 묶음을 고정한다(I-11). */
export const Route = createFileRoute("/")({
  beforeLoad: guard("start"),
  loader: ({ context }) => context.queryClient.query({ ...kioskQueries.current(), staleTime: 0 }),
  errorComponent: StartError,
  component: StartPage,
});

function StartPage() {
  const { data } = useSuspenseQuery(kioskQueries.current());
  const kiosk = useKiosk();

  // 묶음이 준비되면 세션을 열고 kiosk_ready를 남긴다. 이미 열렸으면 전이가 무시한다.
  useEffect(() => {
    if (data.status !== "ready") return;
    kiosk.dispatch({
      type: "open",
      bundle: data,
      sessionId: crypto.randomUUID(),
      kioskName: KIOSK_NAME,
    });
  }, [data, kiosk]);

  if (data.status === "preparing") {
    return (
      <KioskNotice
        title="지금, 어떤 책이 필요한가"
        body="질문을 준비하고 있어요. 잠시만 기다려 주세요."
      />
    );
  }

  // 시작하면 세션이 이 화면을 떠나 첫 질문으로 옮긴다.
  return (
    <NicknameStart
      questionCount={data.questionSet.questions.length}
      onStart={(nickname) => kiosk.dispatch({ type: "start", nickname, now: Date.now() })}
    />
  );
}

function StartError() {
  const router = useRouter();
  return (
    <KioskNotice
      title="질문을 불러오지 못했어요"
      body="잠시 뒤 다시 시도해 주세요."
      action={{ label: "다시 시도", onClick: () => void router.invalidate() }}
    />
  );
}
