import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { downloadDrawers, downloadRecords, importDrawers } from "../admin-api.ts";
import { DeviceDataPanel } from "../components/device-data-panel.tsx";
import { adminQueries } from "../queries.ts";
import { Section } from "../ui/index.ts";
import { LoadError, pendingText } from "./-admin/view.tsx";

/** 기록 내려받기와 서랍 내보내기·가져오기. 서버가 없어 태블릿 밖으로 옮기는 길은 파일뿐이다. */
export const Route = createFileRoute("/admin/records")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(adminQueries.recordCounts()),
      context.queryClient.ensureQueryData(adminQueries.drawers()),
    ]),
  pendingComponent: pendingText("기록을 세고 있어요."),
  errorComponent: LoadError,
  component: RecordsPage,
});

function RecordsPage() {
  const queryClient = useQueryClient();
  const { data: recordCounts } = useSuspenseQuery(adminQueries.recordCounts());
  const { data: drawers } = useSuspenseQuery(adminQueries.drawers());

  return (
    <Section mt="6" gap="4">
      <DeviceDataPanel
        recordCounts={recordCounts}
        currentDrawerCount={drawers.length}
        onDownloadRecords={() => void downloadRecords()}
        onDownloadDrawers={() => void downloadDrawers()}
        onImportDrawers={async (next) => {
          const failure = await importDrawers(next);
          if (failure === undefined) {
            await Promise.all([
              queryClient.invalidateQueries({ queryKey: adminQueries.drawers().queryKey }),
              queryClient.invalidateQueries({ queryKey: adminQueries.publishCheck().queryKey }),
            ]);
          }
          return failure;
        }}
      />
    </Section>
  );
}
