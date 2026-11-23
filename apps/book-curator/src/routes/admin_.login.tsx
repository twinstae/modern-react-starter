import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";

import { setupAdmin, signInAdmin } from "../admin-api.ts";
import { AdminLogin } from "../components/admin-login.tsx";
import { adminQueries } from "../queries.ts";

/** 운영 비밀번호를 정하거나 넣는 화면. 이미 들어왔으면 운영자 화면으로 보낸다. */
export const Route = createFileRoute("/admin_/login")({
  beforeLoad: async ({ context }) => {
    const access = await context.queryClient.ensureQueryData(adminQueries.access());
    if (access === "signed-in") throw redirect({ to: "/admin/drawers" });
    return { access };
  },
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const { access } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const mode = access === "unset" ? "setup" : "sign-in";

  return (
    <AdminLogin
      key={mode}
      mode={mode}
      onSubmit={mode === "setup" ? setupAdmin : signInAdmin}
      onSuccess={async () => {
        // 들어오기 전의 상태를 버려야 운영자 화면이 로그인한 상태를 읽는다.
        queryClient.removeQueries({ queryKey: adminQueries.access().queryKey });
        await navigate({ to: "/admin/drawers" });
      }}
    />
  );
}
