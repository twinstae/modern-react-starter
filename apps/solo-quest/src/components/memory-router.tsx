import { useState, type ReactNode } from "react";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";

/** 링크를 그리는 컴포넌트를 스토리와 테스트에서 앱 라우터 없이 렌더링하기 위한 메모리 라우터. */
export function MemoryRouter({ children }: { children: ReactNode }) {
  const [router] = useState(() =>
    createRouter({
      routeTree: createRootRoute({ component: () => children }),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    }),
  );
  return <RouterProvider router={router} />;
}
