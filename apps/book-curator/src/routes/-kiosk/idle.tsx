import { useEffect, useState } from "react";

import { idleState } from "../../domain/idle.ts";
import { Button, MutedText, SectionTitle, Stack } from "../../ui/index.ts";
import { useKiosk } from "./session.tsx";

/**
 * 손님 화면의 유휴 타이머. 90초 조용하면 묻고, 120초면 처음으로 돌아간다.
 * 주인 화면에는 두지 않는다. 주인 모드에서는 10분 주인 토큰 만료가 안전장치다.
 */
export function IdleGuard({ lastActivityAt }: { lastActivityAt: number }) {
  const kiosk = useKiosk();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const state = idleState(lastActivityAt, now);

  useEffect(() => {
    if (state === "expired") kiosk.dispatch({ type: "reset", reason: "timeout" });
  }, [state, kiosk]);

  if (state !== "prompt") return null;

  return (
    <Stack
      position="fixed"
      inset="0"
      alignItems="center"
      justifyContent="center"
      bg="rgba(33, 28, 23, 0.45)"
      zIndex="modal"
    >
      <Stack
        gap="4"
        maxW="xl"
        mx="6"
        px="8"
        py="10"
        borderRadius="l2"
        bg="paper.50"
        textAlign="center"
        boxShadow="lg"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="idle-prompt-title"
      >
        <SectionTitle fontSize="kiosk-question" id="idle-prompt-title">
          계속하시겠어요?
        </SectionTitle>
        <MutedText fontSize="kiosk-body">
          잠시 응답이 없어요. 이대로 두면 처음 화면으로 돌아갑니다.
        </MutedText>
        <Button
          tone="quiet"
          size="md"
          type="button"
          onClick={() => kiosk.dispatch({ type: "touch", now: Date.now() })}
        >
          계속하기
        </Button>
        <Button
          tone="quiet"
          size="md"
          type="button"
          onClick={() => kiosk.dispatch({ type: "reset", reason: "manual" })}
        >
          처음으로
        </Button>
      </Stack>
    </Stack>
  );
}
