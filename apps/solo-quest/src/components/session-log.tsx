import { styled } from "styled-system/jsx";

import type { RolledTerm } from "../domain/dice.ts";
import type { LogEntry, RollEntry } from "../domain/log-entries.ts";
import { formatInstant } from "../format-instant.ts";
import { SIDE_LABEL } from "./side-label.ts";

const List = styled("ul", {
  base: { display: "flex", flexDirection: "column", gap: "1", listStyle: "none", p: "0" },
});

/** 마스터 편은 왼쪽, 플레이어 편은 오른쪽에 붙고, 편마다 배경색이 다르다. */
const Item = styled("li", {
  base: {
    maxWidth: "80%",
    px: "3",
    py: "1.5",
    borderRadius: "l2",
    // 시각은 덜 중요한 정보라 항목에 마우스를 올리거나 초점이 있을 때만 보인다
    "& time": { opacity: "0", transition: "opacity {durations.fast}" },
    "&:hover time, &:focus-within time": { opacity: "1" },
  },
  variants: {
    side: {
      master: { alignSelf: "flex-start", bg: "blue.a3" },
      player: { alignSelf: "flex-end", bg: "gray.a3" },
    },
  },
});

/** 화자 이름은 내용 앞에 작고 흐리게 붙는다. */
const Speaker = styled("strong", {
  base: { mr: "1.5", fontSize: "sm", fontWeight: "semibold", color: "fg.muted" },
});

const Time = styled("time", { base: { ml: "2", fontSize: "xs", color: "fg.subtle" } });

// 줄바꿈은 그대로 보이고, 내용은 텍스트 노드로만 그려 마크다운을 해석하지 않는다.
const Content = styled("p", { base: { whiteSpace: "pre-wrap", overflowWrap: "anywhere" } });

/** 굴린 항을 값 그대로 이어 보여 준다. 예: `[4, 6] + 1`, `[13] - 1` */
function formatTerms(terms: RolledTerm[]) {
  return terms
    .map((term, index) => {
      const value = term.type === "dice" ? `[${term.values.join(", ")}]` : String(term.value);
      if (index === 0) return term.sign === -1 ? `-${value}` : value;
      return `${term.sign === -1 ? "-" : "+"} ${value}`;
    })
    .join(" ");
}

function RollBody({ entry }: { entry: RollEntry }) {
  return (
    <>
      <strong>{entry.notation}</strong>
      {entry.label && (
        <Content role="note" aria-label="판정 라벨">
          {entry.label}
        </Content>
      )}
      <p>{formatTerms(entry.terms)}</p>
      <p>= {entry.total}</p>
    </>
  );
}

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
              {entry.kind === "message" ? (
                <Content>
                  <Speaker>{entry.speakerName}</Speaker>
                  {entry.content}
                  <Time dateTime={entry.createdAt}>{formatInstant(entry.createdAt)}</Time>
                </Content>
              ) : (
                <>
                  <Speaker>{entry.speakerName}</Speaker>
                  <RollBody entry={entry} />
                  <Time dateTime={entry.createdAt}>{formatInstant(entry.createdAt)}</Time>
                </>
              )}
            </Item>
          ))}
        </List>
      )}
    </section>
  );
}
