import { styled } from "styled-system/jsx";

import type { RolledTerm } from "../domain/dice.ts";
import type { LogEntry, RollEntry } from "../domain/log-entries.ts";
import { formatInstant, formatTime } from "../format-instant.ts";
import { SIDE_LABEL } from "./side-label.ts";

const List = styled("ul", {
  base: { display: "flex", flexDirection: "column", gap: "0.5", listStyle: "none", p: "0" },
});

/**
 * 마스터 편은 왼쪽, 플레이어 편은 오른쪽에 붙는다. 같은 화자가 이어 말한 기록은 한 묶음으로 붙어 있고,
 * 화자가 바뀌는 곳(묶음의 시작)은 위를 띄우고 이름을 한 번 보인다.
 */
const Item = styled("li", {
  base: { display: "flex", flexDirection: "column", maxWidth: "80%", gap: "0.5" },
  variants: {
    side: {
      master: { alignSelf: "flex-start", alignItems: "flex-start" },
      player: { alignSelf: "flex-end", alignItems: "flex-end" },
    },
    groupStart: {
      true: { mt: "3", _first: { mt: "0" } },
    },
  },
});

/** 편마다 배경색이 다른 말풍선 */
const Bubble = styled("div", {
  base: {
    position: "relative",
    px: "3",
    py: "1.5",
    borderRadius: "l3",
    // 시각은 덜 중요한 정보라 자리를 차지하지 않게 말풍선 바깥 옆에 띄우고,
    // 말풍선에 마우스를 올리거나 초점이 있을 때만 보인다. 날짜까지는 title 툴팁으로 보인다.
    "& time": {
      position: "absolute",
      bottom: "1.5",
      whiteSpace: "nowrap",
      fontSize: "xs",
      color: "fg.subtle",
      opacity: "0",
      pointerEvents: "none",
      transition: "opacity {durations.fast}",
    },
    "&:hover time, &:focus-within time": { opacity: "1" },
  },
  variants: {
    side: {
      // 시각은 말풍선이 붙은 쪽의 반대편 옆에 둔다
      master: { bg: "blue.a3", "& time": { left: "100%", ml: "2" } },
      player: { bg: "gray.a3", "& time": { right: "100%", mr: "2" } },
    },
    groupStart: { true: {}, false: {} },
    // 저장 중인 말풍선은 흐리게, 저장하지 못한 말풍선은 점선 테두리로 보인다
    status: {
      committed: {},
      pending: { opacity: "0.6" },
      failed: { borderWidth: "1px", borderStyle: "dashed", borderColor: "red.9" },
    },
  },
  // 묶음 안에서 이어지는 말풍선은 편 쪽 위 모서리를 덜 둥글게 해 앞 말풍선과 이어 보이게 한다
  compoundVariants: [
    { side: "master", groupStart: false, css: { borderTopLeftRadius: "l1" } },
    { side: "player", groupStart: false, css: { borderTopRightRadius: "l1" } },
  ],
});

/** 저장 상태는 말풍선 아래에 작게 붙는다. 저장된 기록에는 없다. */
const StatusMark = styled("span", {
  base: { px: "1", fontSize: "xs" },
  variants: {
    status: {
      pending: { color: "fg.subtle" },
      failed: { color: "red.11", fontWeight: "semibold" },
    },
  },
});

const STATUS_TEXT = { pending: "저장 중", failed: "실패" } as const;

/** 화자 이름은 묶음 위에 한 번, 작고 흐리게 보인다. */
const Speaker = styled("strong", {
  base: { px: "1", fontSize: "xs", fontWeight: "semibold", color: "fg.muted" },
});

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

const RollLabel = styled("span", { base: { mr: "2" } });

const RollDetail = styled("span", { base: { fontSize: "sm", color: "fg.muted" } });

/** 판정에서 가장 중요한 값이라 가장 크게 보인다. */
const RollTotal = styled("strong", {
  base: { ml: "1", fontSize: "xl", fontWeight: "bold", color: "fg.default" },
});

/** 라벨, 표기와 주사위별 값, 합계를 한 줄에 둔다. 예: `자물쇠 따기 2d6+1 · [4, 6] + 1 = 11` */
function RollBody({ entry }: { entry: RollEntry }) {
  return (
    <>
      {entry.label && (
        <RollLabel role="note" aria-label="판정 라벨">
          {entry.label}
        </RollLabel>
      )}
      <RollDetail>
        {entry.notation} · {formatTerms(entry.terms)} =
      </RollDetail>{" "}
      <RollTotal>{entry.total}</RollTotal>
    </>
  );
}

/** 바로 앞 기록과 편과 화자가 같으면 이름을 다시 보이지 않는다. 화자는 이름이 아니라 캐릭터 id로 가른다. */
const continuesPrevious = (entries: LogEntry[], index: number) => {
  const previous = entries[index - 1];
  const entry = entries[index];
  return previous?.side === entry?.side && previous?.speakerId === entry?.speakerId;
};

export function SessionLog({ entries }: { entries: LogEntry[] }) {
  return (
    <section aria-label="세션 로그">
      {entries.length === 0 ? (
        <p>아직 기록이 없습니다</p>
      ) : (
        <List>
          {entries.map((entry, index) => {
            const groupStart = !continuesPrevious(entries, index);
            return (
              <Item
                key={entry.id}
                side={entry.side}
                groupStart={groupStart}
                aria-label={`${SIDE_LABEL[entry.side]} ${entry.speakerName}`}
              >
                {groupStart && <Speaker>{entry.speakerName}</Speaker>}
                <Bubble
                  side={entry.side}
                  groupStart={groupStart}
                  status={entry.status}
                  title={formatInstant(entry.createdAt)}
                >
                  <Content>
                    {entry.kind === "message" ? entry.content : <RollBody entry={entry} />}
                  </Content>
                  <time dateTime={entry.createdAt}>{formatTime(entry.createdAt)}</time>
                </Bubble>
                {entry.status !== "committed" && (
                  <StatusMark role="status" status={entry.status}>
                    {STATUS_TEXT[entry.status]}
                  </StatusMark>
                )}
              </Item>
            );
          })}
        </List>
      )}
    </section>
  );
}
