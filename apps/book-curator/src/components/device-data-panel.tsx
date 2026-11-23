import { Dialog } from "@repo/ui";
import { useId, useState } from "react";

import { parseDrawersFile } from "../domain/device-transfer.ts";
import type { Drawer } from "../domain/drawer.ts";
import {
  Button,
  Card,
  DropZone,
  InlineText,
  Input,
  MutedText,
  SectionTitle,
  StatusText,
  WarningText,
} from "../ui/index.ts";

/** 고른 서랍 파일의 상태. 읽은 서랍·틀린 까닭·바꾼 결과가 한꺼번에 있을 수 없게 한 값으로 둔다. */
type ImportState =
  | { readonly status: "empty" }
  | { readonly status: "invalid"; readonly message: string }
  | { readonly status: "ready"; readonly drawers: readonly Drawer[] }
  | { readonly status: "importing"; readonly drawers: readonly Drawer[] }
  | { readonly status: "failed"; readonly drawers: readonly Drawer[]; readonly message: string }
  | { readonly status: "imported"; readonly count: number };

const bookCountOf = (drawers: readonly Drawer[]) =>
  drawers.reduce((sum, { books }) => sum + books.length, 0);

/**
 * 이 태블릿의 데이터를 밖으로 옮기는 화면. 서버가 없으니 기록은 파일로 내려받아 모으고,
 * 서랍은 파일로 내보내 다른 태블릿에서 가져온다. 가져오기는 지금 서랍을 모두 바꾸므로
 * 빨간 버튼이고 확인 창에서 한 번 더 묻는다.
 */
export function DeviceDataPanel({
  recordCounts,
  currentDrawerCount,
  onDownloadRecords,
  onDownloadDrawers,
  onImportDrawers,
}: {
  recordCounts: { readonly events: number; readonly handovers: number };
  currentDrawerCount: number;
  onDownloadRecords: () => void;
  onDownloadDrawers: () => void;
  onImportDrawers: (drawers: readonly Drawer[]) => Promise<string | undefined>;
}) {
  const id = useId();
  const [state, setState] = useState<ImportState>({ status: "empty" });
  const [dragging, setDragging] = useState(false);

  const read = async (file: File | undefined) => {
    if (file === undefined) return setState({ status: "empty" });
    const result = parseDrawersFile(await file.text());
    setState(
      result.ok
        ? { status: "ready", drawers: result.drawers }
        : { status: "invalid", message: result.message },
    );
  };

  const replace = async (drawers: readonly Drawer[]) => {
    setState({ status: "importing", drawers });
    const failure = await onImportDrawers(drawers);
    setState(
      failure === undefined
        ? { status: "imported", count: drawers.length }
        : { status: "failed", drawers, message: failure },
    );
  };

  return (
    <>
      <Card tone="flat" p="4" gap="3" aria-labelledby={`${id}-records`}>
        <SectionTitle id={`${id}-records`}>기록 내려받기</SectionTitle>
        <InlineText>
          {`손님 차례 기록 ${recordCounts.events}개, 열쇠 건넴 ${recordCounts.handovers}번이 이 태블릿에 있어요.`}
        </InlineText>
        <MutedText>
          기록은 이 태블릿에만 있어요. 브라우저 데이터를 지우거나 앱을 지우면 사라지니 자주 내려받아
          두세요.
        </MutedText>
        <Button type="button" tone="outline" alignSelf="flex-start" onClick={onDownloadRecords}>
          기록 내려받기
        </Button>
      </Card>

      <Card tone="flat" p="4" gap="3" aria-labelledby={`${id}-drawers`}>
        <SectionTitle id={`${id}-drawers`}>서랍 옮기기</SectionTitle>
        <MutedText>
          서랍·문항·책을 파일로 내보내 다른 태블릿에서 가져오거나, 백업해 두었다가 되돌려요.
        </MutedText>
        <Button type="button" tone="outline" alignSelf="flex-start" onClick={onDownloadDrawers}>
          서랍 내보내기
        </Button>

        <DropZone
          data-dragging={dragging}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void read(event.dataTransfer.files[0]);
          }}
        >
          <InlineText weight="strong">내보낸 서랍 파일을 여기에 끌어 놓으세요</InlineText>
          <MutedText>또는 눌러서 파일을 고르세요</MutedText>
          <Input
            srOnly
            type="file"
            accept=".json,application/json"
            aria-label="서랍 파일"
            onChange={(event) => void read(event.target.files?.[0])}
          />
        </DropZone>

        {state.status === "invalid" ? (
          <WarningText role="alert" aria-label="서랍 파일 오류">
            {state.message}
          </WarningText>
        ) : null}

        {state.status === "ready" || state.status === "importing" || state.status === "failed" ? (
          <ReplaceDrawers
            drawers={state.drawers}
            currentDrawerCount={currentDrawerCount}
            busy={state.status === "importing"}
            onConfirm={() => void replace(state.drawers)}
          />
        ) : null}

        {state.status === "failed" ? (
          <WarningText role="alert" aria-label="가져오기 오류">
            {state.message}
          </WarningText>
        ) : null}

        {state.status === "imported" ? (
          <StatusText role="status" aria-label="가져온 결과">
            {`서랍 ${state.count}개를 가져왔어요. 서랍 탭에서 확인하고 공개해 주세요.`}
          </StatusText>
        ) : null}
      </Card>
    </>
  );
}

function ReplaceDrawers({
  drawers,
  currentDrawerCount,
  busy,
  onConfirm,
}: {
  drawers: readonly Drawer[];
  currentDrawerCount: number;
  busy: boolean;
  onConfirm: () => void;
}) {
  return (
    <>
      <StatusText role="status" aria-label="읽은 서랍">
        {`서랍 ${drawers.length}개, 책 ${bookCountOf(drawers)}권을 읽었어요.`}
      </StatusText>
      <Dialog.Root role="alertdialog">
        <Dialog.Trigger asChild>
          <Button type="button" tone="danger" alignSelf="flex-start" disabled={busy}>
            이 서랍으로 바꾸기
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>지금 서랍을 모두 바꿀까요?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Dialog.Description>
                  이 태블릿의 서랍 {currentDrawerCount}개와 그 책이 지워지고, 파일의 서랍{" "}
                  {drawers.length}개로 바뀌어요. 손님 화면은 다시 공개할 때까지 그대로예요.
                </Dialog.Description>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                  <Button type="button" tone="outline">
                    그만두기
                  </Button>
                </Dialog.CloseTrigger>
                <Dialog.CloseTrigger asChild>
                  <Button type="button" tone="danger" onClick={onConfirm}>
                    바꾸기
                  </Button>
                </Dialog.CloseTrigger>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
