import { useId, useState } from "react";
import { Button, Field, Textarea } from "@repo/ui";
import { styled } from "styled-system/jsx";
import * as v from "valibot";

import type { Character, Side } from "../domain/session.ts";
import { countGraphemes, SHORT_TEXT_MAX, ShortText } from "../domain/short-text.ts";
import { SIDE_LABEL } from "./side-label.ts";

export interface MessageValues {
  side: Side;
  /** 화자 캐릭터 id */
  as: string;
  text: string;
}

const Speakers = styled("fieldset", {
  base: { display: "flex", flexWrap: "wrap", gap: "3", borderWidth: "0", p: "0" },
});

const Form = styled("form", { base: { display: "flex", flexDirection: "column", gap: "2" } });

interface MessageInputProps {
  side: Side;
  characters: Character[];
  speakerId: string;
  onSpeakerChange: (characterId: string) => void;
  /** 오류 메시지를 돌려주면 입력을 유지하고 보여 준다. 성공하면 undefined를 돌려준다. */
  onSubmit: (values: MessageValues) => Promise<string | undefined>;
}

export function MessageInput({
  side,
  characters,
  speakerId,
  onSpeakerChange,
  onSubmit,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const errorId = useId();
  const label = SIDE_LABEL[side];
  const parsed = v.safeParse(ShortText, text);
  const remaining = SHORT_TEXT_MAX - countGraphemes(text.trim());

  return (
    <Form
      aria-label={`${label} 입력`}
      onSubmit={async (event) => {
        event.preventDefault();
        if (!parsed.success) return;
        const message = await onSubmit({ side, as: speakerId, text: parsed.output });
        setError(message);
        if (!message) setText("");
      }}
    >
      <Speakers>
        <legend>{label} 화자</legend>
        {characters.map((character) => (
          <label key={character.id}>
            <input
              type="radio"
              name={`${side}-speaker`}
              value={character.id}
              checked={character.id === speakerId}
              onChange={() => onSpeakerChange(character.id)}
            />
            {character.name}
          </label>
        ))}
      </Speakers>
      <Field.Root>
        <Field.Label>{label} 대화</Field.Label>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          aria-invalid={!!error}
          aria-errormessage={error ? errorId : undefined}
        />
        {error && (
          <Field.ErrorText id={errorId} role="alert" aria-label={error}>
            {error}
          </Field.ErrorText>
        )}
      </Field.Root>
      <p role="status" aria-label={`${label} 남은 글자 수`}>
        {remaining}
      </p>
      <Button type="submit" disabled={!parsed.success}>
        {label}로 남기기
      </Button>
    </Form>
  );
}
