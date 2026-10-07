import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { sessionQueries } from "../queries.ts";
import { ApiError } from "../unwrap.ts";

export const Route = createFileRoute("/sessions/$sessionId")({
  loader: async ({ context, params }) => {
    try {
      // 이미 불러온 데이터가 있으면 loader가 막지 않는다. 신선도는 useSuspenseQuery의 기본 동작이 맡는다.
      await context.queryClient.query({
        ...sessionQueries.detail(params.sessionId),
        staleTime: "static",
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) throw notFound();
      throw error;
    }
  },
  notFoundComponent: () => <main>세션이 없습니다</main>,
  component: SessionPage,
});

function SessionPage() {
  const { sessionId } = Route.useParams();
  const { data: session } = useSuspenseQuery(sessionQueries.detail(sessionId));

  return (
    <main>
      <h1>{session.title}</h1>
    </main>
  );
}
