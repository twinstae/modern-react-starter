import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { api } from "../api-client.ts";
import { unwrap } from "../unwrap.ts";

export const Route = createFileRoute("/sessions/$sessionId")({ component: SessionPage });

function SessionPage() {
  const { sessionId } = Route.useParams();
  const session = useQuery({
    queryKey: ["sessions", sessionId],
    queryFn: () => unwrap(api.sessions({ id: sessionId }).get()),
  });

  if (session.isError) return <main>세션이 없습니다</main>;
  return <main>{session.data && <h1>{session.data.title}</h1>}</main>;
}
