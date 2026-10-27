import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { signInAdmin } from "../admin-api.ts";
import { AdminLogin } from "../components/admin-login.tsx";
import { adminQueries } from "../queries.ts";

/** 운영자 로그인. 이미 로그인했으면 운영자 화면으로 보낸다. */
export const Route = createFileRoute("/admin_/login")({
  beforeLoad: async ({ context }) => {
    // 세션을 읽지 못해도 로그인 화면은 연다. 로그인이 실패하면 폼이 까닭을 알린다.
    const me = await context.queryClient.ensureQueryData(adminQueries.me()).catch(() => null);
    if (me !== null) throw redirect({ to: "/admin/shelf" });
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return (
    <AdminLogin
      onSubmit={signInAdmin}
      onSuccess={async () => {
        // 로그인 전의 `null` 세션을 버려야 운영자 화면이 새 세션을 읽는다.
        queryClient.removeQueries({ queryKey: adminQueries.me().queryKey });
        await navigate({ to: "/admin/shelf" });
      }}
    />
  );
}
