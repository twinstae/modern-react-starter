import * as v from "valibot";

import type { QuestionSetDraftSummaryDto } from "../admin-dto.ts";
import {
  Button,
  Card as Bar,
  Field,
  Label,
  MutedText,
  Row,
  Select,
  SimpleForm,
  StatusText,
  SubmitButton,
  TextField,
  WarningText,
} from "../ui/index.ts";

const DraftNameSchema = v.object({
  name: v.pipe(v.string(), v.trim(), v.minLength(1, "초안 이름을 넣어 주세요")),
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
  return (
    <Bar aria-label="질문 세트 초안 고르기">
      <Row alignItems="flex-end" flexWrap="wrap">
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

      <SimpleForm
        aria-label="새 질문 세트 초안"
        schema={DraftNameSchema}
        defaultValues={{ name: "" }}
        resetOnSuccess={["name"]}
        onSubmit={async ({ name }) => {
          onCreate(name);
          return undefined;
        }}
      >
        <Row alignItems="flex-end" flexWrap="wrap">
          <TextField name="name" label="새 초안 이름" placeholder="예: 11월 질문 세트" />
          <SubmitButton disabled={busy}>초안 만들기</SubmitButton>
        </Row>
      </SimpleForm>

      <MutedText>
        새 초안은 시드 질문 세트에서 시작해요. 공개 중인 질문 세트를 고치려면 복제하세요.
      </MutedText>
      {message === null ? null : <StatusText role="status">{message}</StatusText>}
      {error === null ? null : <WarningText role="alert">{error}</WarningText>}
    </Bar>
  );
}
