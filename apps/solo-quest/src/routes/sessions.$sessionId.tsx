import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { api } from "../api-client.ts";

export const Route = createFileRoute("/sessions/$sessionId")({ component: SessionPage });

function SessionPage() {
  const { sessionId } = Route.useParams();
  const session = useQuery({
    queryKey: ["sessions", sessionId],
    queryFn: async () => {
      const { data, error } = await api.sessions({ id: sessionId }).get();
      if (error) throw error;
      return data;
    },
  });

  if (session.isError) return <main>세션이 없습니다</main>;
  return <main>{session.data && <h1>{session.data.title}</h1>}</main>;
}
