import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState, useSyncExternalStore } from "react";
import { styled } from "styled-system/jsx";

import { MessageInput } from "../components/message-input.tsx";
import { SessionLog } from "../components/session-log.tsx";
import { DEFAULT_SPEAKER, type Side } from "../domain/session.ts";
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
      await context.queryClient.query({
        ...sessionQueries.controller(params.sessionId),
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

const Main = styled("main", {
  base: {
    maxWidth: "4xl",
    mx: "auto",
    px: "4",
    py: "8",
    display: "flex",
    flexDirection: "column",
    gap: "6",
  },
});

// 마스터 입력창은 왼쪽, 플레이어 입력창은 오른쪽
const Inputs = styled("div", {
  base: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4" },
});

const SIDES: Side[] = ["master", "player"];

function SessionPage() {
  const { sessionId } = Route.useParams();
  const { data: session } = useSuspenseQuery(sessionQueries.detail(sessionId));
  const { data: controller } = useSuspenseQuery(sessionQueries.controller(sessionId));
  const view = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  const [speakerIds, setSpeakerIds] = useState(DEFAULT_SPEAKER);

  return (
    <Main>
      <h1>{session.title}</h1>
      <SessionLog entries={view.entries} />
      <Inputs>
        {SIDES.map((side) => (
          <MessageInput
            key={side}
            side={side}
            characters={view.characters}
            speakerId={speakerIds[side]}
            onSpeakerChange={(characterId) =>
              setSpeakerIds((previous) => ({ ...previous, [side]: characterId }))
            }
            onSubmit={controller.submit}
          />
        ))}
      </Inputs>
    </Main>
  );
}
