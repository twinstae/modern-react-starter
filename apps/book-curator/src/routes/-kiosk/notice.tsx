import { Button, MutedText, PageTitle, Screen } from "../../ui/index.ts";

/** 손님 화면을 대신하는 조용한 안내. 준비 중, 불러오기 실패, 결과 실패 같은 때 쓴다. */
export function KioskNotice({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { readonly label: string; readonly onClick: () => void };
}) {
  return (
    <Screen
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      gap="6"
      px="page"
      py="12"
      textAlign="center"
    >
      <PageTitle>{title}</PageTitle>
      <MutedText fontSize="kiosk-body" role="status">
        {body}
      </MutedText>
      {action === undefined ? null : (
        <Button tone="quiet" size="md" type="button" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Screen>
  );
}
