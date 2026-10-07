import { Link } from "@tanstack/react-router";
import { styled } from "styled-system/jsx";

import { formatInstant } from "../format-instant.ts";
import type { SessionSummary } from "../domain/session-list-store.ts";

const List = styled("ul", {
  base: { display: "flex", flexDirection: "column", gap: "2", listStyle: "none", p: "0" },
});

const Item = styled("li", {
  base: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: "4",
    px: "4",
    py: "3",
    borderWidth: "1px",
    borderColor: "border",
    borderRadius: "l2",
  },
});

const CreatedAt = styled("time", { base: { color: "fg.muted", fontSize: "sm" } });

export function SessionList({ sessions }: { sessions: SessionSummary[] }) {
  return (
    <section aria-label="세션 목록">
      {sessions.length === 0 ? <p>아직 세션이 없습니다</p> : <SessionItems sessions={sessions} />}
    </section>
  );
}

function SessionItems({ sessions }: { sessions: SessionSummary[] }) {
  return (
    <List>
      {sessions.map((session) => (
        <Item key={session.id} aria-label={session.title}>
          <Link to="/sessions/$sessionId" params={{ sessionId: session.id }}>
            {session.title}
          </Link>
          <CreatedAt dateTime={session.createdAt}>{formatInstant(session.createdAt)}</CreatedAt>
        </Item>
      ))}
    </List>
  );
}
