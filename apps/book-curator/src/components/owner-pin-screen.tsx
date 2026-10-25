import { styled } from "styled-system/jsx";

import { PinEntry } from "./pin-entry.tsx";

const Screen = styled("main", {
  base: {
    minH: "100dvh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "5",
    px: "page",
    py: "10",
    bg: "canvas",
    color: "fg.default",
    borderTopWidth: "8px",
    borderTopColor: "seal.500",
    textAlign: "center",
  },
});

const Header = styled("header", {
  base: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2" },
});

const OwnerLabel = styled("p", {
  base: {
    display: "inline-flex",
    px: "2",
    py: "0.5",
    borderWidth: "2px",
    borderColor: "seal.500",
    borderRadius: "l2",
    color: "seal.600",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "800",
    letterSpacing: "0.08em",
  },
});

const Title = styled("h1", {
  base: { fontFamily: "heading", fontSize: "kiosk-title", fontWeight: "600" },
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

const CancelButton = styled("button", {
  base: {
    minH: "12",
    px: "4",
    borderWidth: "0",
    borderBottomWidth: "1px",
    borderColor: "currentColor",
    bg: "transparent",
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    cursor: "pointer",
    _hover: { color: "fg.default" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "3px" },
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
    <Screen aria-label="주인 확인 PIN">
      <Header>
        <OwnerLabel>주인 모드</OwnerLabel>
        <Title>주인 PIN을 넣어 주세요</Title>
      </Header>
      {notice === null ? null : (
        <Notice role="status" aria-label="주인 확인 안내">
          {notice}
        </Notice>
      )}
      <PinEntry title="주인 PIN" submitLabel="열기" onSubmit={onUnlock} />
      <CancelButton type="button" onClick={onCancel}>
        손님 화면으로
      </CancelButton>
    </Screen>
  );
}
