import type { PublishCheckDto, PublishIssueDto } from "../admin-dto.ts";
import {
  Button,
  Card,
  List,
  ListItem,
  MutedText,
  SectionTitle,
  StatusText,
  WarningText,
} from "../ui/index.ts";

const ISSUE_TEXT: Record<PublishIssueDto["code"], string> = {
  "too-few-drawers": "서랍이 둘 이상 있어야 결과를 고를 수 있어요.",
  "empty-drawer": "문항이 없는 서랍이 있어요",
  "sample-undecided": "결과가 정해지지 않는 답이 있어요.",
  "sample-skew": "무작위로 답하면 결과가 이 서랍에 몰리거나 드물어요",
  "recorded-skew": "쌓인 응답에서 결과가 이 서랍에 몰리거나 드물어요",
  "item-count-imbalance": "다른 서랍보다 문항이 적은 서랍이 있어요",
  "few-books": "책이 3권보다 적은 서랍이 있어요",
};

function IssueList({
  issues,
  nameOf,
  tone,
}: {
  issues: readonly PublishIssueDto[];
  nameOf: (id: string) => string;
  tone: "failure" | "warning";
}) {
  const Text = tone === "failure" ? WarningText : MutedText;
  return (
    <List gap="1">
      {issues.map(({ code, drawers }) => (
        <ListItem key={code}>
          <Text>
            {ISSUE_TEXT[code]}
            {drawers.length === 0 ? "" : `: ${drawers.map(nameOf).join(", ")}`}
          </Text>
        </ListItem>
      ))}
    </List>
  );
}

/**
 * 손님 화면에 공개. 지금 서랍·문항·책을 새 버전으로 얼린다. 공개를 막는 까닭과
 * 알아 두면 좋은 경고를 서랍 이름으로 보여 준다.
 */
export function PublishPanel({
  check,
  drawerNames,
  currentVersion,
  publishing = false,
  result = null,
  onPublish,
}: {
  check: PublishCheckDto;
  drawerNames: ReadonlyMap<string, string>;
  currentVersion: number | null;
  publishing?: boolean;
  result?:
    | { readonly ok: true; readonly version: number }
    | { readonly ok: false; readonly message: string }
    | null;
  onPublish: () => void;
}) {
  const nameOf = (id: string) => drawerNames.get(id) ?? "지운 서랍";

  return (
    <Card tone="paper" p="4" gap="3" aria-labelledby="publish-title">
      <SectionTitle id="publish-title">손님 화면에 공개</SectionTitle>
      <MutedText>
        {currentVersion === null
          ? "아직 공개한 적이 없어요. 공개하기 전까지 태블릿은 준비 중 화면이에요."
          : `지금 태블릿에는 ${currentVersion}번 버전이 나가요. 서랍을 고쳐도 다시 공개해야 반영돼요.`}
      </MutedText>
      {check.failures.length === 0 ? null : (
        <IssueList issues={check.failures} nameOf={nameOf} tone="failure" />
      )}
      {check.warnings.length === 0 ? null : (
        <IssueList issues={check.warnings} nameOf={nameOf} tone="warning" />
      )}
      <Button
        type="button"
        alignSelf="flex-start"
        disabled={!check.canPublish || publishing}
        onClick={onPublish}
      >
        지금 서랍으로 공개
      </Button>
      {result === null ? null : result.ok ? (
        <StatusText role="status" aria-label="공개 결과">
          {result.version}번 버전을 공개했어요. 다음 손님부터 이 버전으로 물어요.
        </StatusText>
      ) : (
        <WarningText role="alert" aria-label="공개 실패">
          {result.message}
        </WarningText>
      )}
    </Card>
  );
}
