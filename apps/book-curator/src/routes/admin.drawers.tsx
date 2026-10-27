import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, createLink, Outlet, useNavigate } from "@tanstack/react-router";
import * as v from "valibot";

import { createDrawer } from "../admin-api.ts";
import { DrawerSchema } from "../domain/drawer.ts";
import { adminQueries } from "../queries.ts";
import {
  Eyebrow,
  MutedText,
  SideLayout,
  SideNav,
  SideNavItem,
  SideNavMeta,
  SimpleForm,
  SubmitButton,
  TextField,
} from "../ui/index.ts";
import { LoadError, messageOf, pendingText } from "./-admin/view.tsx";

const SideNavLink = createLink(SideNavItem);

const NewDrawerSchema = v.object({ name: DrawerSchema.entries.name });

/**
 * 서랍 화면의 틀. 왼쪽에는 공개와 서랍 목록이, 오른쪽에는 고른 페이지가 온다.
 * 고른 서랍은 URL의 `$drawerId`이고, 고르지 않으면 공개 페이지다.
 */
export const Route = createFileRoute("/admin/drawers")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQueries.drawers()),
  pendingComponent: pendingText("서랍을 읽고 있어요."),
  errorComponent: LoadError,
  component: DrawersLayout,
});

function DrawersLayout() {
  const { data: drawers } = useSuspenseQuery(adminQueries.drawers());
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return (
    <SideLayout mt="6">
      <SideNav aria-label="서랍">
        <SideNavLink to="/admin/drawers" activeOptions={{ exact: true }}>
          <span>
            손님 화면에 공개<SideNavMeta>점검하고 지금 서랍을 내보내요</SideNavMeta>
          </span>
        </SideNavLink>

        <Eyebrow mt="4">서랍 {drawers.length}개</Eyebrow>
        {drawers.length === 0 ? <MutedText>아직 서랍이 없어요.</MutedText> : null}
        {drawers.map(({ id, name, questions, books }) => (
          <SideNavLink key={id} to="/admin/drawers/$drawerId" params={{ drawerId: id }}>
            <span>
              {name}
              <SideNavMeta>
                문항 {questions.length} · 책 {books.length}
              </SideNavMeta>
            </span>
          </SideNavLink>
        ))}

        <SimpleForm
          aria-label="새 서랍"
          schema={NewDrawerSchema}
          defaultValues={{ name: "" }}
          resetOnSuccess={["name"]}
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
          <TextField name="name" label="새 서랍 이름" placeholder="예: 나를 들여다보는 책" />
          <SubmitButton tone="outline">서랍 만들기</SubmitButton>
        </SimpleForm>
      </SideNav>

      <Outlet />
    </SideLayout>
  );
}
