import { renderCitation, renderStatement } from "../domain/statement.ts";
import {
  Card,
  Citation,
  Eyebrow,
  MutedText,
  ReasonText,
  SubTitle,
  WarningText,
} from "../ui/index.ts";

const rendered = (render: () => string): string => {
  try {
    return render();
  } catch {
    return "문형을 확인해 주세요";
  }
};

/**
 * 관리자가 쓰는 문장을 손님 화면과 같은 코어로 미리 보여 준다.
 * 조사는 서랍 이름의 받침을 보고, 별명 뒤에는 "님"을 한 번만 붙인다(I-10).
 */
export function StatementPreview({
  drawerName,
  nickname,
  statementTemplate,
  secondStatementTemplate,
  citationTemplate,
  quote,
}: {
  drawerName: string;
  nickname: string;
  statementTemplate: string;
  secondStatementTemplate: string;
  citationTemplate: string;
  quote: string;
}) {
  const first = rendered(() => renderStatement(statementTemplate, { drawerName, nickname }));
  const second = rendered(() => renderStatement(secondStatementTemplate, { drawerName, nickname }));
  const josa = rendered(() => renderStatement("{drawer:이/가}", { drawerName, nickname }));
  const citation = rendered(() => renderCitation(citationTemplate, { quote }));

  return (
    <Card tone="paper" aria-labelledby="statement-preview-title">
      <SubTitle id="statement-preview-title">상태 문장 미리보기</SubTitle>
      <Eyebrow>첫 문장</Eyebrow>
      <ReasonText>{first}</ReasonText>
      <Eyebrow>둘째 문장</Eyebrow>
      <ReasonText>{second}</ReasonText>
      <MutedText>서랍 이름에 붙는 조사: {josa}</MutedText>
      <Eyebrow>인용</Eyebrow>
      <Citation fontSize="kiosk-caption">{citation}</Citation>
      <MutedText>별명 “{nickname}”과 지금 고른 서랍 이름으로 계산했어요.</MutedText>
      {first === "문형을 확인해 주세요" || second === "문형을 확인해 주세요" ? (
        <WarningText role="alert">문장 틀의 자리표시와 조사를 확인해 주세요.</WarningText>
      ) : null}
    </Card>
  );
}
