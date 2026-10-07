import { SimpleForm, SimpleSelect, SimpleTextarea, SimpleWatch, SubmitButton } from "@repo/ui";
import * as v from "valibot";

import { DEFAULT_SPEAKER, type Character, type Side } from "../domain/session.ts";
import { remainingGraphemes, ShortText } from "../domain/short-text.ts";
import { SIDE_LABEL } from "./side-label.ts";

export interface MessageValues {
  side: Side;
  /** 화자 캐릭터 id */
  as: string;
  text: string;
}

const MessageSchema = v.object({
  as: v.pipe(v.string(), v.minLength(1, "화자를 골라주세요")),
  text: ShortText,
});

interface MessageInputProps {
  side: Side;
  characters: Character[];
  /** 처음 골라져 있는 화자. 정하지 않으면 편의 기본 화자다. 이후 화자는 폼이 들고 있다. */
  defaultSpeakerId?: string;
  /** 오류 메시지를 돌려주면 입력을 유지하고 보여 준다. 성공하면 undefined를 돌려준다. */
  onSubmit: (values: MessageValues) => Promise<string | undefined>;
}

export function MessageInput({
  side,
  characters,
  defaultSpeakerId = DEFAULT_SPEAKER[side],
  onSubmit,
}: MessageInputProps) {
  const label = SIDE_LABEL[side];

  return (
    <SimpleForm
      aria-label={`${label} 입력`}
      schema={MessageSchema}
      defaultValues={{ as: defaultSpeakerId, text: "" }}
      // 성공하면 대화만 비우고 화자는 그대로 둔다
      resetOnSuccess={["text"]}
      onSubmit={(values) => onSubmit({ side, ...values })}
    >
      <SimpleSelect
        name="as"
        label={`${label} 화자`}
        items={characters.map((character) => ({ label: character.name, value: character.id }))}
      />
      <SimpleTextarea name="text" label={`${label} 대화`} submitOnEnter />
      <SimpleWatch name="text">
        {(text) => (
          <p role="status" aria-label={`${label} 남은 글자 수`}>
            {remainingGraphemes(String(text))}
          </p>
        )}
      </SimpleWatch>
      <SubmitButton>{label}로 남기기</SubmitButton>
    </SimpleForm>
  );
}
