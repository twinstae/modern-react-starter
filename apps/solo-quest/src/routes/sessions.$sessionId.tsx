import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { styled } from "styled-system/jsx";

import { MessageInput, type MessageValues } from "../components/message-input.tsx";
import { SessionLog } from "../components/session-log.tsx";
import { toLogEntries } from "../domain/log-entries.ts";
import { DEFAULT_SPEAKER, type Side } from "../domain/session.ts";
import { sessionQueries } from "../queries.ts";
import { sessionController } from "../session-client.ts";
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
        ...sessionQueries.view(params.sessionId),
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
  const queryClient = useQueryClient();
  const { data: session } = useSuspenseQuery(sessionQueries.detail(sessionId));
  const { data: view } = useSuspenseQuery(sessionQueries.view(sessionId));
  const [speakerIds, setSpeakerIds] = useState(DEFAULT_SPEAKER);

  // 저장이 끝난 뒤 로그를 다시 불러와 화면에 반영한다. 충돌로 실패했을 때도 최신 로그가 보이도록 결과와 상관없이 무효화한다.
  const submit = async (values: MessageValues) => {
    const error = await sessionController(sessionId).submit(values);
    await queryClient.invalidateQueries({ queryKey: sessionQueries.view(sessionId).queryKey });
    return error;
  };

  return (
    <Main>
      <h1>{session.title}</h1>
      <SessionLog entries={toLogEntries(view.events)} />
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
            onSubmit={submit}
          />
        ))}
      </Inputs>
    </Main>
  );
}
