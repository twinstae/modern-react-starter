import { useState } from "react";
import { Button, Field, Textarea } from "@repo/ui";
import { styled } from "styled-system/jsx";

import type { Character, Side } from "../domain/session.ts";
import { SIDE_LABEL } from "./side-label.ts";

export interface MessageValues {
  side: Side;
  /** 화자 캐릭터 id */
  as: string;
  text: string;
}

const Form = styled("form", { base: { display: "flex", flexDirection: "column", gap: "2" } });

interface MessageInputProps {
  side: Side;
  characters: Character[];
  speakerId: string;
  onSpeakerChange: (characterId: string) => void;
  /** 오류 메시지를 돌려주면 입력을 유지하고 보여 준다. 성공하면 undefined를 돌려준다. */
  onSubmit: (values: MessageValues) => Promise<string | undefined>;
}

export function MessageInput({ side, speakerId, onSubmit }: MessageInputProps) {
  const [text, setText] = useState("");
  const label = SIDE_LABEL[side];

  return (
    <Form
      aria-label={`${label} 입력`}
      onSubmit={async (event) => {
        event.preventDefault();
        await onSubmit({ side, as: speakerId, text: text.trim() });
        setText("");
      }}
    >
      <Field.Root>
        <Field.Label>{label} 대화</Field.Label>
        <Textarea value={text} onChange={(event) => setText(event.target.value)} />
      </Field.Root>
      <Button type="submit">{label}로 남기기</Button>
    </Form>
  );
}
