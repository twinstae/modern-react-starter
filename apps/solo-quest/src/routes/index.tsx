import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { styled } from "styled-system/jsx";

import { api } from "../api-client.ts";
import { NewSessionForm, type NewSessionValues } from "../components/new-session-form.tsx";
import { SessionList } from "../components/session-list.tsx";
import { unwrap } from "../unwrap.ts";

export const Route = createFileRoute("/")({ component: Home });

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
  // 만든 뒤 폼을 비우기 위해 새로 마운트한다
  const [formKey, setFormKey] = useState(0);
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: () => unwrap(api.sessions.get()),
  });

  const createSession = async (values: NewSessionValues) => {
    await unwrap(api.sessions.post(values));
    await queryClient.invalidateQueries({ queryKey: ["sessions"] });
    setFormKey((key) => key + 1);
  };

  return (
    <Main>
      <h1>SOLO QUEST</h1>
      <NewSessionForm key={formKey} onSubmit={createSession} />
      {sessions.data && <SessionList sessions={sessions.data} />}
    </Main>
  );
}
