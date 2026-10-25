import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { styled } from "styled-system/jsx";

import { HealthStatus } from "../components/health-status.tsx";
import { healthQueries } from "../queries.ts";

export const Route = createFileRoute("/")({
  // 이미 불러온 데이터가 있으면 loader가 막지 않는다. 신선도는 useSuspenseQuery의 기본 동작이 맡는다.
  loader: ({ context }) =>
    context.queryClient.query({ ...healthQueries.current(), staleTime: "static" }),
  component: Home,
});

const Main = styled("main", {
  base: {
    maxWidth: "2xl",
    mx: "auto",
    px: "8",
    py: "12",
    display: "flex",
    flexDirection: "column",
    gap: "6",
  },
});

function Home() {
  const { data: health } = useSuspenseQuery(healthQueries.current());

  return (
    <Main>
      <h1>지금, 어떤 책이 필요한가</h1>
      <HealthStatus health={health} />
    </Main>
  );
}
