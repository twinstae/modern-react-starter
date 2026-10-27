import { Dialog } from "@repo/ui";

import { Button } from "../ui/index.ts";

/**
 * 서랍 지우기. 누르면 경고 창에서 한 번 더 묻는다. 서랍 속 책도 함께 지워지고, 이미 공개한
 * 버전은 그대로라는 것은 이 창에서만 알린다. 지우기는 되돌릴 수 없어 빨간 버튼이다.
 */
export function DeleteDrawerButton({
  drawerName,
  bookCount,
  deleting = false,
  onDelete,
}: {
  drawerName: string;
  bookCount: number;
  deleting?: boolean;
  onDelete: () => void;
}) {
  return (
    <Dialog.Root role="alertdialog">
      <Dialog.Trigger asChild>
        <Button type="button" tone="danger" alignSelf="flex-start" disabled={deleting}>
          서랍 지우기
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>“{drawerName}” 서랍을 지울까요?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Dialog.Description>
                {bookCount === 0 ? "" : `서랍 속 책 ${bookCount}권도 함께 지워져요. `}
                이미 손님 화면에 공개한 버전은 다시 공개할 때까지 그대로예요.
              </Dialog.Description>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <Button type="button" tone="outline">
                  그만두기
                </Button>
              </Dialog.CloseTrigger>
              <Button type="button" tone="danger" onClick={onDelete}>
                지우기
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
