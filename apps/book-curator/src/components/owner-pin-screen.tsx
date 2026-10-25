import { styled } from "styled-system/jsx";

import { PinEntry } from "./pin-entry.tsx";
import { Button, Eyebrow, PageTitle, Screen } from "../ui/index.ts";

const Header = styled("header", {
  base: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2" },
});

const Notice = styled("p", {
  base: {
    maxW: "34rem",
    p: "3",
    borderWidth: "2px",
    borderColor: "pine.500",
    borderRadius: "l2",
    bg: "surface",
    fontFamily: "body",
    fontSize: "kiosk-caption",
  },
});

/**
 * 주인 PIN을 넣는 잠금 화면. 손님 결과와 다른 seal 테두리와 "주인 모드" 표시로
 * 지금 주인 화면임을 알린다. PIN 확인과 실패 문구는 부모가 맡는다.
 */
export function OwnerPinScreen({
  notice = null,
  onUnlock,
  onCancel,
}: {
  notice?: string | null;
  onUnlock: (pin: string) => Promise<string | undefined>;
  onCancel: () => void;
}) {
  return (
    <Screen
      tone="owner"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap="5"
      px="page"
      py="10"
      textAlign="center"
      aria-label="주인 확인 PIN"
    >
      <Header>
        <Eyebrow tone="seal">주인 모드</Eyebrow>
        <PageTitle>주인 PIN을 넣어 주세요</PageTitle>
      </Header>
      {notice === null ? null : (
        <Notice role="status" aria-label="주인 확인 안내">
          {notice}
        </Notice>
      )}
      <PinEntry title="주인 PIN" submitLabel="열기" onSubmit={onUnlock} />
      <Button tone="link" onClick={onCancel}>
        손님 화면으로
      </Button>
    </Screen>
  );
}
