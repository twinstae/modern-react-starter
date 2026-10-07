import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSyncExternalStore } from "react";
import { styled } from "styled-system/jsx";

import { CharacterPanel } from "../components/character-panel.tsx";
import { MessageInput } from "../components/message-input.tsx";
import { SessionLog } from "../components/session-log.tsx";
import type { Side } from "../domain/session.ts";
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

// 화면 높이에 맞춘다. 로그만 스크롤하고 입력창은 아래에 남는다.
const Main = styled("main", {
  base: {
    maxWidth: "3xl",
    height: "100dvh",
    mx: "auto",
    px: "4",
    py: "4",
    display: "flex",
    flexDirection: "column",
    gap: "3",
  },
});

const Title = styled("h1", { base: { textStyle: "xl", fontWeight: "semibold" } });

// 캐릭터 패널은 제목 옆에 접혀 있어 자리를 거의 차지하지 않는다
const Header = styled("div", {
  base: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "3" },
});

// 말풍선 옆에 띄운 시각이 좁은 화면에서 가로 스크롤을 만들지 않게 가로로는 자른다
const LogScroll = styled("div", {
  base: { flex: "1", minHeight: "0", overflowY: "auto", overflowX: "hidden" },
});

// 마스터 입력창은 왼쪽, 플레이어 입력창은 오른쪽
const Inputs = styled("div", {
  base: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3" },
});

const SIDES: Side[] = ["master", "player"];

function SessionPage() {
  const { sessionId } = Route.useParams();
  const { data: session } = useSuspenseQuery(sessionQueries.detail(sessionId));
  const { data: controller } = useSuspenseQuery(sessionQueries.controller(sessionId));
  const view = useSyncExternalStore(controller.subscribe, controller.getSnapshot);

  return (
    <Main>
      <Header>
        <Title>{session.title}</Title>
        <CharacterPanel
          characters={view.characters}
          onAdd={controller.addCharacter}
          onArchive={controller.archiveCharacter}
        />
      </Header>
      <LogScroll>
        <SessionLog entries={view.entries} />
      </LogScroll>
      <Inputs>
        {SIDES.map((side) => (
          <MessageInput
            key={side}
            side={side}
            characters={view.characters}
            restored={view.restored[side]}
            onSubmit={controller.submit}
          />
        ))}
      </Inputs>
    </Main>
  );
}
