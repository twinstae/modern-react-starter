import { styled } from "styled-system/jsx";

import { judgeRoll, type RolledTerm } from "../domain/dice.ts";
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

const FATE_FACE = { [-1]: "-", 0: "0", 1: "+" } as const;

/** 굴린 항 하나의 값. 주사위는 값 목록으로, Fate 주사위는 +, 0, -로 보인다. */
const formatTerm = (term: RolledTerm) => {
  if (term.type === "constant") return String(term.value);
  const faces = term.type === "fate" ? term.values.map((value) => FATE_FACE[value]) : term.values;
  return `[${faces.join(", ")}]`;
};

/** 굴린 항을 값 그대로 이어 보여 준다. 예: `[4, 6] + 1`, `[13] - 1`, `[+, 0, -] + 3` */
function formatTerms(terms: RolledTerm[]) {
  return terms
    .map((term, index) => {
      const value = formatTerm(term);
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

/** 비교 판정의 승패. 액션 점수만큼 크지 않게, 합계 옆에 이어 둔다. */
const CheckResult = styled("span", { base: { fontSize: "sm", fontWeight: "semibold" } });

/** 차이는 이긴 쪽이 +다. 0도 +0으로 보여 성공했음을 드러낸다. */
const formatMargin = (margin: number) => (margin < 0 ? String(margin) : `+${margin}`);

/**
 * 비교 판정의 목표와 승패. 도전 주사위는 `> [5, 7] X O`(진 것을 앞에)와 Match,
 * 목표치는 목표가 표기에 있으므로 `O +3`처럼 승패와 차이만 보인다.
 */
function CheckBody({ entry }: { entry: RollEntry }) {
  const { check } = entry;
  if (!check) return null;
  const judged = judgeRoll(entry);
  if (check.against.type === "number") {
    return (
      <>
        {" "}
        <CheckResult>
          {judged.success ? "O" : "X"} {formatMargin(judged.value)}
        </CheckResult>
      </>
    );
  }
  const wins = judged.wins ?? [];
  const marks = [...wins.filter((win) => !win), ...wins.filter(Boolean)].map((win) =>
    win ? "O" : "X",
  );
  return (
    <>
      <RollDetail>
        {" "}
        {check.op} [{check.against.values.join(", ")}]
      </RollDetail>{" "}
      <CheckResult>
        {marks.join(" ")}
        {judged.match && " Match"}
      </CheckResult>
    </>
  );
}

/**
 * 라벨, 표기와 주사위별 값, 합계를 한 줄에 둔다. 예: `자물쇠 따기 2d6+1 · [4, 6] + 1 = 11`
 * 비교 판정은 합계 대신 액션 점수를 크게 보이고(상한에 걸리면 `14 → 10`), 뒤에 목표와 승패를 둔다.
 */
function RollBody({ entry }: { entry: RollEntry }) {
  const { score } = judgeRoll(entry);
  return (
    <>
      {entry.label && (
        <RollLabel role="note" aria-label="판정 라벨">
          {entry.label}
        </RollLabel>
      )}
      <RollDetail>
        {entry.notation} · {formatTerms(entry.terms)} =
        {score !== entry.total && ` ${entry.total} →`}
      </RollDetail>{" "}
      <RollTotal>{score}</RollTotal>
      <CheckBody entry={entry} />
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
        <List aria-label="세션 로그">
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
