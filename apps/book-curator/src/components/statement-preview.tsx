import { styled } from "styled-system/jsx";

import { renderCitation, renderStatement } from "../domain/statement.ts";

const Panel = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3",
    p: "4",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    boxShadow: "zine",
  },
});

const Title = styled("h3", {
  base: { fontFamily: "body", fontSize: "kiosk-body", fontWeight: "700" },
});

const Label = styled("p", {
  base: {
    color: "pine.700",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    letterSpacing: "0.06em",
  },
});

const First = styled("p", {
  base: {
    fontFamily: "heading",
    fontSize: "xl",
    fontWeight: "600",
    lineHeight: "1.35",
    wordBreak: "keep-all",
  },
});

const Second = styled("p", {
  base: { fontFamily: "heading", fontSize: "kiosk-body", lineHeight: "1.4", wordBreak: "keep-all" },
});

const Small = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const Citation = styled("blockquote", {
  base: {
    m: "0",
    pl: "3",
    borderLeftWidth: "4px",
    borderColor: "yellow.500",
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    lineHeight: "1.5",
  },
});

const Failure = styled("p", {
  base: { color: "seal.500", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "700" },
});

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
    <Panel aria-labelledby="statement-preview-title">
      <Title id="statement-preview-title">상태 문장 미리보기</Title>
      <Label>첫 문장</Label>
      <First aria-label="첫 상태 문장">{first}</First>
      <Label>둘째 문장</Label>
      <Second aria-label="둘째 상태 문장">{second}</Second>
      <Small aria-label="조사 확인">서랍 이름에 붙는 조사: {josa}</Small>
      <Label>인용</Label>
      <Citation aria-label="인용 미리보기">{citation}</Citation>
      <Small>별명 “{nickname}”과 지금 고른 서랍 이름으로 계산했어요.</Small>
      {first === "문형을 확인해 주세요" || second === "문형을 확인해 주세요" ? (
        <Failure role="alert">문장 틀의 자리표시와 조사를 확인해 주세요.</Failure>
      ) : null}
    </Panel>
  );
}
