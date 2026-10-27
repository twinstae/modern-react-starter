import { useQueryClient } from "@tanstack/react-query";
import {
  createFileRoute,
  createLink,
  Outlet,
  redirect,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";

import { signOutAdmin } from "../admin-api.ts";
import { adminQueries } from "../queries.ts";
import {
  Button,
  Card,
  Eyebrow,
  InlineText,
  MutedText,
  PageHeader,
  PageTitle,
  Row,
  Screen,
  Stack,
  Tab,
  TabList,
} from "../ui/index.ts";

const TabLink = createLink(Tab);

/**
 * 운영자 화면의 틀. 로그인하지 않았으면 로그인 페이지로 보낸다. 서가·서랍·질문 세트·주인 PIN은
 * 저마다 다른 페이지이고, 탭은 그 페이지로 가는 링크다.
 */
export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ context }) => {
    const me = await context.queryClient.ensureQueryData(adminQueries.me());
    if (me === null) throw redirect({ to: "/admin/login" });
    return { me };
  },
  pendingComponent: SessionPending,
  errorComponent: SessionError,
  component: AdminLayout,
});

function AdminLayout() {
  const { me } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return (
    <Screen tone="none" px="page" py="8">
      <Stack width="full" maxW="80rem" mx="auto" gap="0">
        <PageHeader pb="4">
          <div>
            <Eyebrow>BOOK SHOP 79-1</Eyebrow>
            <PageTitle fontSize="2xl">운영자 화면</PageTitle>
            <InlineText display="block" weight="strong" overflowWrap="anywhere">
              {me.user.email}
            </InlineText>
          </div>
          <Row gap="3">
            <Button
              tone="outline"
              size="sm"
              type="button"
              onClick={async () => {
                await signOutAdmin();
                queryClient.removeQueries({ queryKey: adminQueries.me().queryKey });
                await navigate({ to: "/admin/login" });
              }}
            >
              로그아웃
            </Button>
          </Row>
        </PageHeader>

        <TabList as="nav" aria-label="운영자 화면">
          <TabLink to="/admin/shelf">서가</TabLink>
          <TabLink to="/admin/drawers">서랍</TabLink>
          <TabLink to="/admin/questions">질문 세트</TabLink>
          <TabLink to="/admin/pin">주인 PIN</TabLink>
        </TabList>

        <Outlet />
      </Stack>
    </Screen>
  );
}

function SessionPending() {
  return (
    <Screen tone="none" px="page" py="8">
      <Stack minH="calc(100dvh - 4rem)" alignItems="center" justifyContent="center" gap="0">
        <MutedText role="status">운영자 세션을 확인하고 있어요.</MutedText>
      </Stack>
    </Screen>
  );
}

function SessionError() {
  const router = useRouter();

  return (
    <Screen tone="none" px="page" py="8">
      <Stack minH="calc(100dvh - 4rem)" alignItems="center" justifyContent="center" gap="0">
        <Card tone="paper" width="full" maxW="30rem" p="6" md={{ p: "8" }}>
          <PageTitle fontSize="2xl">운영자 세션을 읽지 못했어요</PageTitle>
          <MutedText>잠시 뒤 다시 열어 주세요.</MutedText>
          <Button tone="outline" size="sm" type="button" onClick={() => void router.invalidate()}>
            다시 시도
          </Button>
        </Card>
      </Stack>
    </Screen>
  );
}
