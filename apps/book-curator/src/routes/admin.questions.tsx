import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useNavigate, useParams } from "@tanstack/react-router";

import { clonePublishedQuestionSetDraft, createQuestionSetDraft } from "../admin-api.ts";
import { QuestionSetDraftBar } from "../components/question-set-draft-bar.tsx";
import { adminQueries } from "../queries.ts";
import { MutedText, Row, Section, SectionTitle } from "../ui/index.ts";
import { LoadError, messageOf, pendingText } from "./-admin/view.tsx";

/** 새 초안은 이름을 붙여 만들거나 공개 버전을 복제한다. 어느 쪽이든 결과는 새 초안 하나다. */
type NewDraft = { readonly from: "name"; readonly name: string } | { readonly from: "published" };

/** 질문 세트 초안 목록과 공개 버전. 고른 초안은 URL의 `$draftId`다. */
export const Route = createFileRoute("/admin/questions")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(adminQueries.questionSetDrafts()),
      context.queryClient.ensureQueryData(adminQueries.publishedVersions()),
    ]),
  pendingComponent: pendingText("질문 세트를 읽고 있어요."),
  errorComponent: LoadError,
  component: QuestionsPage,
});

function QuestionsPage() {
  const { data: drafts } = useSuspenseQuery(adminQueries.questionSetDrafts());
  const { data: versions } = useSuspenseQuery(adminQueries.publishedVersions());
  const { draftId } = useParams({ strict: false });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const openDraft = (id: string) =>
    navigate({ to: "/admin/questions/$draftId", params: { draftId: id } });

  const newDraft = useMutation({
    mutationFn: (request: NewDraft) =>
      request.from === "name"
        ? createQuestionSetDraft(request.name)
        : clonePublishedQuestionSetDraft(),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({
        queryKey: adminQueries.questionSetDrafts().queryKey,
      });
      await openDraft(created.id);
    },
  });

  return (
    <Section mt="6" gap="4" aria-labelledby="admin-questions-title">
      <Row justifyContent="space-between" flexWrap="wrap" gap="3">
        <SectionTitle id="admin-questions-title">질문 세트</SectionTitle>
        <MutedText>
          문장을 쓰는 자리예요. 저장은 초안에만 하고, 점검을 통과해야 새 버전으로 공개할 수 있어요.
        </MutedText>
      </Row>

      <QuestionSetDraftBar
        drafts={drafts}
        selectedId={draftId ?? null}
        onSelect={(id) => {
          newDraft.reset();
          void openDraft(id);
        }}
        onCreate={(name) => newDraft.mutate({ from: "name", name })}
        onClone={() => newDraft.mutate({ from: "published" })}
        busy={newDraft.isPending}
        message={newDraft.isSuccess ? `“${newDraft.data.name}” 초안을 만들었어요.` : null}
        error={newDraft.isError ? messageOf(newDraft.error) : null}
      />

      <Outlet />

      <MutedText>
        공개 버전:{" "}
        {versions.length === 0
          ? "아직 없음"
          : versions
              .map(({ version, questionCount }) => `${version}번(${questionCount}문항)`)
              .join(" · ")}
      </MutedText>
    </Section>
  );
}
