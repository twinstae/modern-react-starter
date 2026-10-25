import { useState } from "react";
import { styled } from "styled-system/jsx";

import type { QuestionSetDraftSummaryDto } from "../admin-dto.ts";

const Bar = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3",
    p: "4",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
  },
});

const Row = styled("div", {
  base: { display: "flex", alignItems: "flex-end", gap: "3", flexWrap: "wrap" },
});

const Field = styled("div", {
  base: { display: "flex", flexDirection: "column", gap: "1", minW: "16rem", flex: "1" },
});

const Label = styled("label", {
  base: { fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "700" },
});

const Control = styled("input", {
  base: {
    width: "full",
    minH: "11",
    px: "3",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
  },
});

const Select = styled("select", {
  base: {
    width: "full",
    minH: "11",
    px: "3",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
  },
});

const Button = styled("button", {
  base: {
    minH: "11",
    px: "4",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    cursor: "pointer",
    _hover: { bg: "paper.100" },
    _disabled: { cursor: "not-allowed", opacity: "0.5" },
  },
});

const Primary = styled(Button, {
  base: { borderColor: "pine.700", bg: "pine.600", color: "paper.50", _hover: { bg: "pine.700" } },
});

const Note = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const Status = styled("p", {
  base: { color: "pine.700", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "700" },
});

const ErrorText = styled("p", {
  base: { color: "seal.500", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "700" },
});

/** 초안 고르기·만들기·복제. 본문 편집은 아래 편집기가 맡는다. */
export function QuestionSetDraftBar({
  drafts,
  selectedId,
  onSelect,
  onCreate,
  onClone,
  busy = false,
  message = null,
  error = null,
}: {
  drafts: readonly QuestionSetDraftSummaryDto[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
  onClone: () => void;
  busy?: boolean;
  message?: string | null;
  error?: string | null;
}) {
  const [name, setName] = useState("");

  return (
    <Bar aria-label="질문 세트 초안 고르기">
      <Row>
        <Field>
          <Label htmlFor="question-set-draft-select">질문 세트 초안</Label>
          <Select
            id="question-set-draft-select"
            value={selectedId ?? ""}
            onChange={(event) => {
              if (event.target.value !== "") onSelect(event.target.value);
            }}
          >
            <option value="">초안을 고르세요</option>
            {drafts.map((draft) => (
              <option key={draft.id} value={draft.id}>
                {draft.name} · {draft.questionCount}문항
              </option>
            ))}
          </Select>
        </Field>
        <Button type="button" onClick={onClone} disabled={busy}>
          공개 버전 복제
        </Button>
      </Row>

      <Row>
        <Field>
          <Label htmlFor="question-set-draft-name">새 초안 이름</Label>
          <Control
            id="question-set-draft-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="예: 11월 질문 세트"
          />
        </Field>
        <Primary
          type="button"
          disabled={busy || name.trim() === ""}
          onClick={() => {
            onCreate(name.trim());
            setName("");
          }}
        >
          초안 만들기
        </Primary>
      </Row>

      <Note>새 초안은 시드 질문 세트에서 시작해요. 공개 중인 질문 세트를 고치려면 복제하세요.</Note>
      {message === null ? null : <Status role="status">{message}</Status>}
      {error === null ? null : <ErrorText role="alert">{error}</ErrorText>}
    </Bar>
  );
}
