import { Field } from "@ark-ui/react";
import type { ComponentProps } from "react";
import { styled } from "styled-system/jsx";
import { input } from "styled-system/recipes";

const TextareaBase = styled(Field.Textarea, input);

export type TextareaProps = ComponentProps<typeof TextareaBase>;
/** 여러 줄 입력. Input 레시피를 쓰되 높이는 내용에 맞게 늘어난다. */
export function Textarea(props: TextareaProps) {
  return <TextareaBase rows={3} height="auto" py="2" resize="vertical" {...props} />;
}
