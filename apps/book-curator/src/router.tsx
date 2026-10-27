import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { Provider } from "jotai";

import { api } from "./api-client.ts";
import type { FunnelEvent } from "./domain/funnel.ts";
import { createKiosk } from "./kiosk-store.ts";
import { routeTree } from "./routeTree.gen";
import { unwrap } from "./unwrap.ts";

const sendEvents = async (events: readonly FunnelEvent[]) => {
  await unwrap(api.events.post({ events: [...events] }));
};

export function getRouter() {
  const queryClient = new QueryClient();
  const kiosk = createKiosk(sendEvents);

  const router = createTanStackRouter({
    routeTree,
    context: { queryClient, kiosk },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    Wrap: ({ children }) => <Provider store={kiosk.store}>{children}</Provider>,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
