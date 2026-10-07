import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sessions/$sessionId")({ component: SessionPage });

function SessionPage() {
  return <main />;
}
