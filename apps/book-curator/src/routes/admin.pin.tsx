import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { saveOwnerPin } from "../admin-api.ts";
import { PinEntry } from "../components/pin-entry.tsx";
import { MutedText, Section, SectionTitle, Stack, StatusText } from "../ui/index.ts";

export const Route = createFileRoute("/admin/pin")({
  component: PinPage,
});

function PinPage() {
  // 저장 실패는 PinEntry가 보여 준다. 여기서는 마지막 저장이 성공했는지만 본다.
  const save = useMutation({ mutationFn: saveOwnerPin });
  const saved = save.isSuccess && save.data === undefined;

  return (
    <Section mt="6" gap="4" aria-labelledby="admin-pin-title">
      <SectionTitle id="admin-pin-title">주인 PIN</SectionTitle>
      <Stack gap="3" maxW="28rem">
        <MutedText>태블릿에서 주인 확인을 열 때 쓰는 PIN이에요. 정하거나 바꿀 수 있어요.</MutedText>
        <PinEntry
          title="주인 PIN"
          submitLabel="PIN 저장"
          onSubmit={(pin) => save.mutateAsync(pin)}
        />
        {saved ? <StatusText role="status">PIN을 저장했어요.</StatusText> : null}
      </Stack>
    </Section>
  );
}
