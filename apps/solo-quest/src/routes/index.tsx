import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { styled } from "styled-system/jsx";

import { api } from "../api-client.ts";
import { NewSessionForm, type NewSessionValues } from "../components/new-session-form.tsx";
import { SessionList } from "../components/session-list.tsx";
import { sessionQueries } from "../queries.ts";
import { unwrap } from "../unwrap.ts";
import { button } from "styled-system/recipes/index.js";
import { Settings2 } from "lucide-react";

export const Route = createFileRoute("/")({
  // 이미 불러온 데이터가 있으면 loader가 막지 않는다. 신선도는 useSuspenseQuery의 기본 동작이 맡는다.
  loader: ({ context }) =>
    context.queryClient.query({ ...sessionQueries.list(), staleTime: "static" }),
  component: Home,
});

const Main = styled("main", {
  base: {
    maxWidth: "2xl",
    mx: "auto",
    px: "4",
    py: "8",
    display: "flex",
    flexDirection: "column",
    gap: "6",
  },
});

function Home() {
  const queryClient = useQueryClient();
  const { data: sessions } = useSuspenseQuery(sessionQueries.list());
  // 만든 뒤 폼을 비우기 위해 새로 마운트한다
  const [formKey, setFormKey] = useState(0);

  const createSession = async (values: NewSessionValues) => {
    await unwrap(api.sessions.post(values));
    await queryClient.invalidateQueries({ queryKey: sessionQueries.list().queryKey });
    setFormKey((key) => key + 1);
  };

  return (
    <Main>
      <h1>SOLO QUEST</h1>
      <Link
        to="/oracles"
        className={button({ variant: "subtle", size: "sm" })}
        aria-label="오라클 관리"
      >
        <Settings2 /> 오라클 관리
      </Link>
      <NewSessionForm key={formKey} onSubmit={createSession} />
      <SessionList sessions={sessions} />
    </Main>
  );
}
