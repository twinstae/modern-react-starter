import { useState } from "react";
import { styled } from "styled-system/jsx";

import type { QuestionSetDraftSummaryDto } from "../admin-dto.ts";
import {
  Button,
  Card as Bar,
  Field,
  Input as Control,
  Label,
  MutedText,
  StatusText,
  WarningText,
} from "../ui/index.ts";

const Row = styled("div", {
  base: { display: "flex", alignItems: "flex-end", gap: "3", flexWrap: "wrap" },
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
        <Button
          type="button"
          disabled={busy || name.trim() === ""}
          onClick={() => {
            onCreate(name.trim());
            setName("");
          }}
        >
          초안 만들기
        </Button>
      </Row>

      <MutedText>
        새 초안은 시드 질문 세트에서 시작해요. 공개 중인 질문 세트를 고치려면 복제하세요.
      </MutedText>
      {message === null ? null : <StatusText role="status">{message}</StatusText>}
      {error === null ? null : <WarningText role="alert">{error}</WarningText>}
    </Bar>
  );
}
