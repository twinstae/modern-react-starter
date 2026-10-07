import { styled } from "styled-system/jsx";

import type { RolledTerm } from "../domain/dice.ts";
import type { LogEntry, RollEntry } from "../domain/log-entries.ts";
import { formatInstant } from "../format-instant.ts";
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
    px: "3",
    py: "1.5",
    borderRadius: "l3",
    // 시각은 덜 중요한 정보라 말풍선에 마우스를 올리거나 초점이 있을 때만 보인다
    "& time": { opacity: "0", transition: "opacity {durations.fast}" },
    "&:hover time, &:focus-within time": { opacity: "1" },
  },
  variants: {
    side: {
      master: { bg: "blue.a3" },
      player: { bg: "gray.a3" },
    },
    groupStart: { true: {}, false: {} },
  },
  // 묶음 안에서 이어지는 말풍선은 편 쪽 위 모서리를 덜 둥글게 해 앞 말풍선과 이어 보이게 한다
  compoundVariants: [
    { side: "master", groupStart: false, css: { borderTopLeftRadius: "l1" } },
    { side: "player", groupStart: false, css: { borderTopRightRadius: "l1" } },
  ],
});

/** 화자 이름은 묶음 위에 한 번, 작고 흐리게 보인다. */
const Speaker = styled("strong", {
  base: { px: "1", fontSize: "xs", fontWeight: "semibold", color: "fg.muted" },
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

/** 바로 앞 기록과 편과 화자가 같으면 이름을 다시 보이지 않는다. */
const continuesPrevious = (entries: LogEntry[], index: number) => {
  const previous = entries[index - 1];
  const entry = entries[index];
  return previous?.side === entry?.side && previous?.speakerName === entry?.speakerName;
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
                <Bubble side={entry.side} groupStart={groupStart}>
                  <Content>
                    {entry.kind === "message" ? entry.content : <RollBody entry={entry} />}
                    <Time dateTime={entry.createdAt}>{formatInstant(entry.createdAt)}</Time>
                  </Content>
                </Bubble>
              </Item>
            );
          })}
        </List>
      )}
    </section>
  );
}
