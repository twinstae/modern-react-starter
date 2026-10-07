import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { styled } from "styled-system/jsx";

import { api } from "../api-client.ts";
import { ServerStatus, type ServerStatusValue } from "../components/server-status.tsx";

export const Route = createFileRoute("/")({ component: Home });

const Main = styled("main", {
  base: {
    minHeight: "screen",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "2",
  },
});

function Home() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const { data, error } = await api.health.get();
      if (error) throw error;
      return data;
    },
  });

  const status: ServerStatusValue = health.isPending
    ? "checking"
    : health.data?.status === "ok"
      ? "ok"
      : "unreachable";

  return (
    <Main>
      <h1>SOLO QUEST</h1>
      <ServerStatus status={status} />
    </Main>
  );
}
