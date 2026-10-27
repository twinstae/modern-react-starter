import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { publishQuestionSetDraft, saveQuestionSetDraft } from "../admin-api.ts";
import { QuestionSetEditor } from "../components/question-set-editor.tsx";
import { SetReportPanel } from "../components/set-report-panel.tsx";
import type { QuestionSet } from "../domain/question-set.ts";
import { adminQueries, kioskQueries } from "../queries.ts";
import { LoadError, messageOf, pendingText } from "./-admin/view.tsx";

/** 초안 하나의 편집기와 점검. 다른 초안으로 옮기면 공개 결과 안내가 남지 않도록 새로 그린다. */
export const Route = createFileRoute("/admin/questions/$draftId")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(adminQueries.questionSetDraft(params.draftId)),
      context.queryClient.ensureQueryData(adminQueries.questionSetReport(params.draftId)),
    ]),
  remountDeps: ({ params }) => params.draftId,
  pendingComponent: pendingText("초안을 읽고 점검을 돌리고 있어요."),
  errorComponent: LoadError,
  component: DraftPage,
});

function DraftPage() {
  const { draftId } = Route.useParams();
  const { data: draft } = useSuspenseQuery(adminQueries.questionSetDraft(draftId));
  const { data: report } = useSuspenseQuery(adminQueries.questionSetReport(draftId));
  const queryClient = useQueryClient();
  const invalidate = (queryKey: readonly unknown[]) => queryClient.invalidateQueries({ queryKey });

  const save = useMutation({
    mutationFn: ({ name, questionSet }: { name: string; questionSet: QuestionSet }) =>
      saveQuestionSetDraft(draftId, name, questionSet),
    onSuccess: () =>
      Promise.all([
        invalidate(adminQueries.questionSetDraft(draftId).queryKey),
        invalidate(adminQueries.questionSetReport(draftId).queryKey),
        invalidate(adminQueries.questionSetDrafts().queryKey),
      ]),
  });

  const publish = useMutation({
    mutationFn: () => publishQuestionSetDraft(draftId),
    onSuccess: () =>
      Promise.all([
        invalidate(adminQueries.publishedVersions().queryKey),
        invalidate(adminQueries.questionSetReport(draftId).queryKey),
        invalidate(adminQueries.questionSetDraft(draftId).queryKey),
        invalidate(adminQueries.questionSetDrafts().queryKey),
        invalidate(adminQueries.shelf().queryKey),
        invalidate(kioskQueries.current().queryKey),
      ]),
  });

  return (
    <>
      <QuestionSetEditor
        key={`${draft.id}:${draft.updatedAt}`}
        draft={draft}
        onSave={async (input) => {
          try {
            await save.mutateAsync(input);
            return undefined;
          } catch (error) {
            return messageOf(error);
          }
        }}
      />
      <SetReportPanel
        report={report}
        drawers={draft.questionSet.drawers.map(({ code, name }) => ({ code, name }))}
        onPublish={() => publish.mutate()}
        publishing={publish.isPending}
        publishMessage={
          publish.isSuccess ? `공개 버전 ${publish.data.version}을 만들었어요.` : null
        }
        publishError={publish.isError ? messageOf(publish.error) : null}
      />
    </>
  );
}
