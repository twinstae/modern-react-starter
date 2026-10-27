import { useState } from "react";

import { Button, Card, MutedText, PageTitle, SectionTitle, WarningText } from "../ui/index.ts";

type PinState =
  | { readonly status: "idle" }
  | { readonly status: "generating" }
  | { readonly status: "generated"; readonly pin: string }
  | { readonly status: "failed"; readonly message: string };

/**
 * 주인 PIN 만들기. 운영자가 정하지 않고 숫자 6자리를 새로 만든다. 저장소에는 해시만 남아
 * 이 화면을 떠나면 다시 볼 수 없으므로, 잊으면 새로 만든다. 새로 만들면 예전 PIN은 막힌다.
 */
export function OwnerPinGenerator({
  onGenerate,
}: {
  onGenerate: () => Promise<{ readonly pin: string } | { readonly error: string }>;
}) {
  const [state, setState] = useState<PinState>({ status: "idle" });

  const generate = async () => {
    setState({ status: "generating" });
    const result = await onGenerate();
    setState(
      "pin" in result
        ? { status: "generated", pin: result.pin }
        : { status: "failed", message: result.error },
    );
  };

  return (
    <Card tone="paper" p="4" gap="3" maxW="28rem" aria-labelledby="owner-pin-title">
      <SectionTitle id="owner-pin-title">주인 PIN</SectionTitle>
      <MutedText>
        태블릿에서 주인 확인을 열 때 쓰는 PIN이에요. 새로 만들면 예전 PIN은 더 쓸 수 없어요.
      </MutedText>
      {state.status === "generated" ? (
        <>
          <PageTitle aria-label="새 주인 PIN">{state.pin}</PageTitle>
          <MutedText>이 화면을 떠나면 다시 볼 수 없어요. 지금 적어 두세요.</MutedText>
        </>
      ) : null}
      {state.status === "failed" ? (
        <WarningText role="alert" aria-label="PIN 만들기 실패">
          {state.message}
        </WarningText>
      ) : null}
      <Button
        type="button"
        alignSelf="flex-start"
        disabled={state.status === "generating"}
        onClick={() => void generate()}
      >
        새 PIN 만들기
      </Button>
    </Card>
  );
}
