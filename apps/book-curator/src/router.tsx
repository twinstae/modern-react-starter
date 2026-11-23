import { QueryClient } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { Provider } from "jotai";

import { device } from "./device.ts";
import type { FunnelEvent } from "./domain/funnel.ts";
import { createKiosk } from "./kiosk-store.ts";
import { routeTree } from "./routeTree.gen";

/** 퍼널 이벤트는 이 기기의 저장소에 추가 전용으로 쌓는다. 운영 화면에서 내려받는다. */
const sendEvents = async (events: readonly FunnelEvent[]) => {
  await (await device()).events.append(events);
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
