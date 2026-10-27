import type { PublishBlockerDto, QuestionSetDraftReportDto } from "../admin-dto.ts";
import type { DrawerCode } from "../domain/question-set.ts";
import {
  Actions,
  Button,
  Card as Panel,
  FieldError as ErrorText,
  InlineText,
  List,
  ListItem,
  MutedText,
  PageHeader,
  ProgressBar,
  Section,
  SectionTitle,
  Stack,
  StatusText as Status,
  SubTitle,
} from "../ui/index.ts";

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

const FailureItem = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <ListItem
    aria-label={label}
    display="block"
    color="seal.500"
    fontFamily="body"
    fontSize="kiosk-caption"
    fontWeight="700"
  >
    {children}
  </ListItem>
);

const WarningItem = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <ListItem
    aria-label={label}
    display="block"
    color="pine.700"
    fontFamily="body"
    fontSize="kiosk-caption"
    fontWeight="600"
  >
    {children}
  </ListItem>
);

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
      <PageHeader>
        <div>
          <SectionTitle id="set-report-title">공개 전 점검</SectionTitle>
          <MutedText>
            표본 {report.report.sample.samples.toLocaleString("ko-KR")}건 · 쌓인 응답{" "}
            {recorded === undefined ? "아직 없음" : `${recorded.samples}건`}
          </MutedText>
        </div>
        {report.canPublish ? (
          <Status role="status">점검과 서가 게이트를 통과했어요.</Status>
        ) : (
          <ErrorText role="alert">아직 공개할 수 없어요.</ErrorText>
        )}
      </PageHeader>

      <Section>
        <SubTitle>서랍별 1순위 비율</SubTitle>
        <MutedText>초록 막대는 표본, 노란 막대는 쌓인 응답이에요. 10~18% 안이어야 해요.</MutedText>
        <List gap="2">
          {report.report.sample.byDrawer.map((rate) => {
            const name = names.get(rate.drawer) ?? rate.drawer;
            const recordedRate = recorded?.byDrawer.find(({ drawer }) => drawer === rate.drawer);
            return (
              <ListItem
                key={rate.drawer}
                display="grid"
                gridTemplateColumns="minmax(8rem, 1fr) minmax(0, 2fr)"
                alignItems="center"
                gap="3"
              >
                <InlineText weight="strong">{name}</InlineText>
                <Stack gap="1">
                  <ProgressBar label={`${name} 표본 1순위 비율`} value={rate.firstRate} />
                  {recordedRate === undefined ? null : (
                    <ProgressBar
                      label={`${name} 쌓인 응답 1순위 비율`}
                      value={recordedRate.firstRate}
                      tone="yellow"
                    />
                  )}
                  <InlineText tone="muted">
                    표본 {percent(rate.firstRate)}
                    {recordedRate === undefined
                      ? ""
                      : ` · 쌓인 응답 ${percent(recordedRate.firstRate)}`}
                  </InlineText>
                </Stack>
              </ListItem>
            );
          })}
        </List>
      </Section>

      <Section>
        <SubTitle>고칠 곳</SubTitle>
        {failures.length === 0 ? (
          <MutedText>막는 문제는 없어요.</MutedText>
        ) : (
          <List aria-label="점검 실패" gap="1">
            {failures.map((issue, index) => (
              <FailureItem
                key={`${issue.code}-${index}`}
                label={`점검 실패: ${issueText(issue, names)}`}
              >
                {issueText(issue, names)}
              </FailureItem>
            ))}
          </List>
        )}
        {report.report.gate.warnings.length === 0 ? null : (
          <List aria-label="점검 경고" gap="1">
            {report.report.gate.warnings.map((issue, index) => (
              <WarningItem
                key={`${issue.code}-${index}`}
                label={`점검 경고: ${issueText(issue, names)}`}
              >
                {issueText(issue, names)}
              </WarningItem>
            ))}
          </List>
        )}
      </Section>

      <Section>
        <SubTitle>기준 응답</SubTitle>
        {report.report.structure.baselines.length === 0 ? (
          <MutedText>이 초안에는 기준 응답이 없어요.</MutedText>
        ) : (
          <List aria-label="기준 응답 점검" gap="1">
            {report.report.structure.baselines.map((baseline) => (
              <WarningItem
                key={baseline.name}
                label={`기준 응답 ${baseline.name} ${baseline.matches ? "일치" : "불일치"}`}
              >
                {baseline.name}: 기대 {names.get(baseline.expectedFirst) ?? baseline.expectedFirst}{" "}
                · {names.get(baseline.expectedSecond) ?? baseline.expectedSecond} → 실제{" "}
                {names.get(baseline.actualFirst) ?? baseline.actualFirst} ·{" "}
                {names.get(baseline.actualSecond) ?? baseline.actualSecond}{" "}
                {baseline.matches ? "(일치)" : "(불일치)"}
              </WarningItem>
            ))}
          </List>
        )}
      </Section>

      <Section>
        <SubTitle>서가 게이트</SubTitle>
        {report.shelfGate.passed ? (
          <MutedText>모든 서랍에 책이 3종 이상 있어요.</MutedText>
        ) : (
          <List aria-label="서가 게이트 부족" gap="1">
            {report.shelfGate.lacking.map(({ drawer, name, kinds }) => (
              <FailureItem key={drawer} label={`서가 게이트 ${name} ${kinds}종`}>
                {name}: {kinds}종 (3종 이상 필요)
              </FailureItem>
            ))}
          </List>
        )}
      </Section>

      {report.blockers.length === 0 ? null : (
        <Section>
          <SubTitle>공개를 막는 이유</SubTitle>
          <List aria-label="공개를 막는 이유" gap="1">
            {report.blockers.map((blocker, index) => (
              <FailureItem
                key={`${blocker.code}-${index}`}
                label={`공개 막힘: ${blockerText(blocker, names, report)}`}
              >
                {blockerText(blocker, names, report)}
              </FailureItem>
            ))}
          </List>
        </Section>
      )}

      <Actions align="between" divider>
        <MutedText>공개하면 새 버전 번호가 붙고, 지금 공개 중인 버전이 바뀌어요.</MutedText>
        <Button
          type="button"
          size="md"
          onClick={onPublish}
          disabled={!report.canPublish || publishing}
        >
          {publishing ? "공개하는 중…" : "새 버전으로 공개"}
        </Button>
      </Actions>

      {publishMessage === null ? null : <Status role="status">{publishMessage}</Status>}
      {publishError === null ? null : <ErrorText role="alert">{publishError}</ErrorText>}
    </Panel>
  );
}
