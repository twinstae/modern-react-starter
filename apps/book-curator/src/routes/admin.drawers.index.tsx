import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { publishDrawers } from "../admin-api.ts";
import { PublishPanel } from "../components/publish-panel.tsx";
import { adminQueries, kioskQueries } from "../queries.ts";
import { LoadError, messageOf, pendingText } from "./-admin/view.tsx";

/** 서랍을 고르지 않았을 때의 오른쪽. 지금 서랍을 점검하고 손님 화면에 공개한다. */
export const Route = createFileRoute("/admin/drawers/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(adminQueries.publishCheck()),
      context.queryClient.ensureQueryData(adminQueries.publishedVersions()),
    ]),
  pendingComponent: pendingText("공개 점검을 돌리고 있어요."),
  errorComponent: LoadError,
  component: PublishPage,
});

function PublishPage() {
  const { data: drawers } = useSuspenseQuery(adminQueries.drawers());
  const { data: check } = useSuspenseQuery(adminQueries.publishCheck());
  const { data: versions } = useSuspenseQuery(adminQueries.publishedVersions());
  const queryClient = useQueryClient();

  const publish = useMutation({
    mutationFn: publishDrawers,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueries.publishedVersions().queryKey }),
        queryClient.invalidateQueries({ queryKey: kioskQueries.current().queryKey }),
      ]),
  });

  return (
    <PublishPanel
      check={check}
      drawerNames={new Map(drawers.map(({ id, name }) => [id, name]))}
      currentVersion={versions.at(-1)?.version ?? null}
      publishing={publish.isPending}
      result={
        publish.isSuccess
          ? { ok: true, version: publish.data.version }
          : publish.isError
            ? { ok: false, message: messageOf(publish.error) }
            : null
      }
      onPublish={() => publish.mutate()}
    />
  );
}
