import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as v from "valibot";

import { createDrawer, publishDrawers } from "../admin-api.ts";
import { PublishPanel } from "../components/publish-panel.tsx";
import { DrawerSchema } from "../domain/drawer.ts";
import { adminQueries, kioskQueries } from "../queries.ts";
import {
  List,
  ListItem,
  MutedText,
  Row,
  Section,
  SectionTitle,
  SimpleForm,
  SubmitButton,
  TextField,
} from "../ui/index.ts";
import { LoadError, messageOf, pendingText } from "./-admin/view.tsx";

const NewDrawerSchema = v.object({ name: DrawerSchema.entries.name });

/**
 * 서랍 목록. 서랍마다 문항과 책이 몇 개인지 보고 서랍 페이지로 들어간다.
 * 고친 서랍은 아래에서 공개해야 손님 태블릿에 나간다.
 */
export const Route = createFileRoute("/admin/drawers/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(adminQueries.drawers()),
      context.queryClient.ensureQueryData(adminQueries.publishCheck()),
      context.queryClient.ensureQueryData(adminQueries.publishedVersions()),
    ]),
  pendingComponent: pendingText("서랍을 읽고 있어요."),
  errorComponent: LoadError,
  component: DrawersPage,
});

function DrawersPage() {
  const { data: drawers } = useSuspenseQuery(adminQueries.drawers());
  const { data: check } = useSuspenseQuery(adminQueries.publishCheck());
  const { data: versions } = useSuspenseQuery(adminQueries.publishedVersions());
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const publish = useMutation({
    mutationFn: publishDrawers,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminQueries.publishedVersions().queryKey }),
        queryClient.invalidateQueries({ queryKey: kioskQueries.current().queryKey }),
      ]),
  });

  return (
    <Section mt="6" gap="5" aria-labelledby="admin-drawers-title">
      <Row justifyContent="space-between" flexWrap="wrap" gap="3">
        <SectionTitle id="admin-drawers-title">서랍</SectionTitle>
        <MutedText>서랍마다 문항과 책을 채우고, 다 되면 공개해요.</MutedText>
      </Row>

      {drawers.length === 0 ? (
        <MutedText>아직 서랍이 없어요. 아래에서 첫 서랍을 만들어 주세요.</MutedText>
      ) : (
        <List gap="2" aria-label="서랍 목록">
          {drawers.map(({ id, name, questions, books }) => (
            <ListItem key={id}>
              <Link to="/admin/drawers/$drawerId" params={{ drawerId: id }}>
                {name}
              </Link>
              <MutedText>
                문항 {questions.length}개 · 책 {books.length}권
              </MutedText>
            </ListItem>
          ))}
        </List>
      )}

      <SimpleForm
        aria-label="새 서랍"
        schema={NewDrawerSchema}
        defaultValues={{ name: "" }}
        onSubmit={async ({ name }: { name: string }) => {
          try {
            const created = await createDrawer(name);
            await queryClient.invalidateQueries({ queryKey: ["admin"] });
            await navigate({ to: "/admin/drawers/$drawerId", params: { drawerId: created.id } });
            return undefined;
          } catch (error) {
            return messageOf(error);
          }
        }}
      >
        <Row alignItems="flex-end" flexWrap="wrap">
          <TextField name="name" label="새 서랍 이름" placeholder="예: 나를 들여다보는 책" />
          <SubmitButton>서랍 만들기</SubmitButton>
        </Row>
      </SimpleForm>

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
    </Section>
  );
}
