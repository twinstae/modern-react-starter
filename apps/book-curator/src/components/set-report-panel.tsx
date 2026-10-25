import { styled } from "styled-system/jsx";

import type { PublishBlockerDto, QuestionSetDraftReportDto } from "../admin-dto.ts";
import type { DrawerCode } from "../domain/question-set.ts";

const Panel = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "5",
    p: "5",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    boxShadow: "zineLg",
  },
});

const Header = styled("div", {
  base: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "3",
    flexWrap: "wrap",
    pb: "3",
    borderBottomWidth: "2px",
    borderColor: "border",
  },
});

const Title = styled("h3", {
  base: { fontFamily: "heading", fontSize: "xl", fontWeight: "600" },
});

const Summary = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const Section = styled("section", {
  base: { display: "flex", flexDirection: "column", gap: "2" },
});

const SectionTitle = styled("h4", {
  base: { fontFamily: "body", fontSize: "kiosk-body", fontWeight: "700" },
});

const Bars = styled("ul", {
  base: { display: "flex", flexDirection: "column", gap: "2", m: "0", p: "0", listStyle: "none" },
});

const BarRow = styled("li", {
  base: {
    display: "grid",
    gridTemplateColumns: "minmax(8rem, 1fr) minmax(0, 2fr)",
    alignItems: "center",
    gap: "3",
  },
});

const DrawerName = styled("span", {
  base: { fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "700", wordBreak: "keep-all" },
});

const Track = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "1",
  },
});

const Bar = styled("div", {
  base: {
    height: "3",
    borderWidth: "1px",
    borderColor: "border",
    bg: "paper.100",
  },
});

const Fill = styled("div", {
  base: { height: "full", bg: "pine.500" },
});

const RecordedFill = styled("div", {
  base: { height: "full", bg: "yellow.500", borderTopWidth: "1px", borderColor: "border" },
});

const Rate = styled("span", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const IssueList = styled("ul", {
  base: { display: "flex", flexDirection: "column", gap: "1", m: "0", p: "0", listStyle: "none" },
});

const FailureItem = styled("li", {
  base: { color: "seal.500", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "700" },
});

const WarningItem = styled("li", {
  base: { color: "pine.700", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "600" },
});

const Note = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const Actions = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "3",
    flexWrap: "wrap",
    pt: "3",
    borderTopWidth: "2px",
    borderColor: "border",
  },
});

const PublishButton = styled("button", {
  base: {
    minH: "11",
    px: "5",
    borderWidth: "2px",
    borderColor: "pine.700",
    borderRadius: "l2",
    bg: "pine.600",
    color: "paper.50",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "zine",
    _hover: { bg: "pine.700" },
    _active: { translate: "2px 2px", boxShadow: "none" },
    _disabled: { cursor: "not-allowed", opacity: "0.6" },
  },
});

const Status = styled("p", {
  base: { color: "pine.700", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "700" },
});

const ErrorText = styled("p", {
  base: { color: "seal.500", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "700" },
});

const percent = (rate: number): string => `${(rate * 100).toFixed(1)}%`;

const issueText = (
  issue: QuestionSetDraftReportDto["report"]["gate"]["failures"][number],
  names: ReadonlyMap<DrawerCode, string>,
): string => {
  const drawers = issue.drawers.map((code) => names.get(code) ?? code).join(", ");
  switch (issue.code) {
    case "sample-undecided":
      return "표본에서 1·2순위가 정해지지 않은 답이 있어요";
    case "sample-skew":
      return `표본의 1순위가 10~18%를 벗어난 서랍: ${drawers}`;
    case "recorded-skew":
      return `쌓인 응답의 1순위가 10~18%를 벗어난 서랍: ${drawers}`;
    case "empty-drawer":
      return `문항이 하나도 없는 서랍: ${drawers}`;
    case "item-count-imbalance":
      return `문항 수가 다른 서랍: ${drawers}`;
    case "baseline-mismatch":
      return `기준 응답이 기대한 순위와 달라요: ${issue.baselines.join(", ")}`;
  }
};

const blockerText = (
  blocker: PublishBlockerDto,
  names: ReadonlyMap<DrawerCode, string>,
  report: QuestionSetDraftReportDto,
): string => {
  const code = blocker.code;
  if (code === "shelf-gate") {
    const lacking = report.shelfGate.lacking
      .map(({ name, kinds }) => `${name} ${kinds}종`)
      .join(", ");
    return `서가 게이트: 서랍마다 3종 이상이어야 해요. 지금 ${lacking}`;
  }
  return issueText({ code, drawers: blocker.drawers, baselines: blocker.baselines }, names);
};

/**
 * 공개 전 점검 보고. 관리자가 "어느 서랍의 문항을 고쳐야 하는지" 먼저 보이게 하고,
 * 세부 기준 응답은 아래에 둔다. 공개 버튼은 서버가 돌려준 `canPublish`로만 열린다.
 */
export function SetReportPanel({
  report,
  drawers,
  onPublish,
  publishing = false,
  publishMessage = null,
  publishError = null,
}: {
  report: QuestionSetDraftReportDto;
  drawers: readonly { readonly code: DrawerCode; readonly name: string }[];
  onPublish: () => void;
  publishing?: boolean;
  publishMessage?: string | null;
  publishError?: string | null;
}) {
  const names = new Map(drawers.map(({ code, name }) => [code, name]));
  const recorded = report.report.recorded;
  const failures = report.report.gate.failures;

  return (
    <Panel aria-labelledby="set-report-title">
      <Header>
        <div>
          <Title id="set-report-title">공개 전 점검</Title>
          <Summary>
            표본 {report.report.sample.samples.toLocaleString("ko-KR")}건 · 쌓인 응답{" "}
            {recorded === undefined ? "아직 없음" : `${recorded.samples}건`}
          </Summary>
        </div>
        {report.canPublish ? (
          <Status role="status">점검과 서가 게이트를 통과했어요.</Status>
        ) : (
          <ErrorText role="alert">아직 공개할 수 없어요.</ErrorText>
        )}
      </Header>

      <Section>
        <SectionTitle>서랍별 1순위 비율</SectionTitle>
        <Note>초록 막대는 표본, 노란 막대는 쌓인 응답이에요. 10~18% 안이어야 해요.</Note>
        <Bars>
          {report.report.sample.byDrawer.map((rate) => {
            const name = names.get(rate.drawer) ?? rate.drawer;
            const recordedRate = recorded?.byDrawer.find(({ drawer }) => drawer === rate.drawer);
            return (
              <BarRow key={rate.drawer}>
                <DrawerName>{name}</DrawerName>
                <Track>
                  <Bar
                    role="progressbar"
                    aria-label={`${name} 표본 1순위 비율`}
                    aria-valuenow={Math.round(rate.firstRate * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <Fill style={{ width: `${rate.firstRate * 100}%` }} />
                  </Bar>
                  {recordedRate === undefined ? null : (
                    <Bar
                      role="progressbar"
                      aria-label={`${name} 쌓인 응답 1순위 비율`}
                      aria-valuenow={Math.round(recordedRate.firstRate * 100)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <RecordedFill style={{ width: `${recordedRate.firstRate * 100}%` }} />
                    </Bar>
                  )}
                  <Rate>
                    표본 {percent(rate.firstRate)}
                    {recordedRate === undefined
                      ? ""
                      : ` · 쌓인 응답 ${percent(recordedRate.firstRate)}`}
                  </Rate>
                </Track>
              </BarRow>
            );
          })}
        </Bars>
      </Section>

      <Section>
        <SectionTitle>고칠 곳</SectionTitle>
        {failures.length === 0 ? (
          <Note>막는 문제는 없어요.</Note>
        ) : (
          <IssueList aria-label="점검 실패">
            {failures.map((issue, index) => (
              <FailureItem
                key={`${issue.code}-${index}`}
                aria-label={`점검 실패: ${issueText(issue, names)}`}
              >
                {issueText(issue, names)}
              </FailureItem>
            ))}
          </IssueList>
        )}
        {report.report.gate.warnings.length === 0 ? null : (
          <IssueList aria-label="점검 경고">
            {report.report.gate.warnings.map((issue, index) => (
              <WarningItem
                key={`${issue.code}-${index}`}
                aria-label={`점검 경고: ${issueText(issue, names)}`}
              >
                {issueText(issue, names)}
              </WarningItem>
            ))}
          </IssueList>
        )}
      </Section>

      <Section>
        <SectionTitle>기준 응답</SectionTitle>
        {report.report.structure.baselines.length === 0 ? (
          <Note>이 초안에는 기준 응답이 없어요.</Note>
        ) : (
          <IssueList aria-label="기준 응답 점검">
            {report.report.structure.baselines.map((baseline) => (
              <WarningItem
                key={baseline.name}
                aria-label={`기준 응답 ${baseline.name} ${baseline.matches ? "일치" : "불일치"}`}
              >
                {baseline.name}: 기대 {names.get(baseline.expectedFirst) ?? baseline.expectedFirst}{" "}
                · {names.get(baseline.expectedSecond) ?? baseline.expectedSecond} → 실제{" "}
                {names.get(baseline.actualFirst) ?? baseline.actualFirst} ·{" "}
                {names.get(baseline.actualSecond) ?? baseline.actualSecond}{" "}
                {baseline.matches ? "(일치)" : "(불일치)"}
              </WarningItem>
            ))}
          </IssueList>
        )}
      </Section>

      <Section>
        <SectionTitle>서가 게이트</SectionTitle>
        {report.shelfGate.passed ? (
          <Note>모든 서랍에 책이 3종 이상 있어요.</Note>
        ) : (
          <IssueList aria-label="서가 게이트 부족">
            {report.shelfGate.lacking.map(({ drawer, name, kinds }) => (
              <FailureItem key={drawer} aria-label={`서가 게이트 ${name} ${kinds}종`}>
                {name}: {kinds}종 (3종 이상 필요)
              </FailureItem>
            ))}
          </IssueList>
        )}
      </Section>

      {report.blockers.length === 0 ? null : (
        <Section>
          <SectionTitle>공개를 막는 이유</SectionTitle>
          <IssueList aria-label="공개를 막는 이유">
            {report.blockers.map((blocker, index) => (
              <FailureItem
                key={`${blocker.code}-${index}`}
                aria-label={`공개 막힘: ${blockerText(blocker, names, report)}`}
              >
                {blockerText(blocker, names, report)}
              </FailureItem>
            ))}
          </IssueList>
        </Section>
      )}

      <Actions>
        <Note>공개하면 새 버전 번호가 붙고, 지금 공개 중인 버전이 바뀌어요.</Note>
        <PublishButton
          type="button"
          onClick={onPublish}
          disabled={!report.canPublish || publishing}
        >
          {publishing ? "공개하는 중…" : "새 버전으로 공개"}
        </PublishButton>
      </Actions>

      {publishMessage === null ? null : <Status role="status">{publishMessage}</Status>}
      {publishError === null ? null : <ErrorText role="alert">{publishError}</ErrorText>}
    </Panel>
  );
}
