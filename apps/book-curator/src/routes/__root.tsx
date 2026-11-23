import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { PageRoot } from "@repo/ui";

import type { Kiosk } from "../kiosk-store.ts";

interface RouterContext {
  queryClient: QueryClient;
  kiosk: Kiosk;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <PageRoot>
      <Outlet />
    </PageRoot>
  ),
});
