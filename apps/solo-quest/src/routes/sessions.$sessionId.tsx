import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { sessionQueries } from "../queries.ts";
import { ApiError } from "../unwrap.ts";

export const Route = createFileRoute("/sessions/$sessionId")({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(sessionQueries.detail(params.sessionId));
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
