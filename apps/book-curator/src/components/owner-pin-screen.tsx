import { PinEntry } from "./pin-entry.tsx";
import { Button, Eyebrow, InfoBox, PageTitle, Screen, Stack } from "../ui/index.ts";

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
      <Stack alignItems="center" gap="2">
        <Eyebrow tone="seal">주인 모드</Eyebrow>
        <PageTitle>주인 PIN을 넣어 주세요</PageTitle>
      </Stack>
      {notice === null ? null : (
        <InfoBox role="status" aria-label="주인 확인 안내" maxW="34rem">
          {notice}
        </InfoBox>
      )}
      <PinEntry title="주인 PIN" submitLabel="열기" onSubmit={onUnlock} />
      <Button tone="link" onClick={onCancel}>
        손님 화면으로
      </Button>
    </Screen>
  );
}
