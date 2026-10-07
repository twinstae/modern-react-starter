import { styled } from "styled-system/jsx";

import type { LogEntry } from "../domain/log-entries.ts";
import { formatInstant } from "../format-instant.ts";
import { SIDE_LABEL } from "./side-label.ts";

const List = styled("ul", {
  base: { display: "flex", flexDirection: "column", gap: "2", listStyle: "none", p: "0" },
});

/** 마스터 편은 왼쪽, 플레이어 편은 오른쪽에 붙는다. */
const Item = styled("li", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "1",
    maxWidth: "80%",
    px: "4",
    py: "3",
    borderWidth: "1px",
    borderColor: "border",
    borderRadius: "l2",
  },
  variants: {
    side: {
      master: { alignSelf: "flex-start" },
      player: { alignSelf: "flex-end" },
    },
  },
});

const Meta = styled("div", {
  base: { display: "flex", gap: "2", alignItems: "baseline", color: "fg.muted", fontSize: "sm" },
});

// 줄바꿈은 그대로 보이고, 내용은 텍스트 노드로만 그려 마크다운을 해석하지 않는다.
const Content = styled("p", { base: { whiteSpace: "pre-wrap", overflowWrap: "anywhere" } });

export function SessionLog({ entries }: { entries: LogEntry[] }) {
  return (
    <section aria-label="세션 로그">
      {entries.length === 0 ? (
        <p>아직 기록이 없습니다</p>
      ) : (
        <List>
          {entries.map((entry) => (
            <Item
              key={entry.id}
              side={entry.side}
              aria-label={`${SIDE_LABEL[entry.side]} ${entry.speakerName}`}
            >
              <Meta>
                <strong>{entry.speakerName}</strong>
                <time dateTime={entry.createdAt}>{formatInstant(entry.createdAt)}</time>
              </Meta>
              <Content>{entry.content}</Content>
            </Item>
          ))}
        </List>
      )}
    </section>
  );
}
