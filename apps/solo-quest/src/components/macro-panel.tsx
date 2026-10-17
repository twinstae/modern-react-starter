import { Button, Popover, SimpleForm, SimpleInput, SimpleTextarea, SubmitButton } from "@repo/ui";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { styled } from "styled-system/jsx";
import * as v from "valibot";

import type { Macro } from "../domain/session.ts";
import { ShortText } from "../domain/short-text.ts";

const AddSchema = v.object({
  name: ShortText,
  definition: v.pipe(v.string(), v.trim(), v.minLength(1, "매크로 식을 입력해주세요")),
});

interface MacroPanelProps {
  macros: Macro[];
  /** 매크로를 더한다. 오류 메시지를 돌려주면 보여 준다. */
  onAdd: (values: { name: string; definition: string }) => Promise<string | undefined>;
  /** 매크로를 지운다. 오류 메시지를 돌려주면 보여 준다. */
  onRemove: (macroId: string) => Promise<string | undefined>;
}

/** 식은 길어서 패널이 넓다 */
const Content = styled("div", { base: { width: "md", maxWidth: "calc(100vw - 2rem)" } });

const List = styled("ul", {
  base: { display: "flex", flexDirection: "column", gap: "2", listStyle: "none", p: "0" },
});

const Row = styled("li", {
  base: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "2" },
});

/** 식은 이름 아래에 작게, 고정폭 글꼴로 보인다. */
const Definition = styled("code", {
  base: { display: "block", fontSize: "xs", color: "fg.muted", overflowWrap: "anywhere" },
});

const RemoveError = styled("p", { base: { mt: "2", fontSize: "sm", color: "error" } });

const AddWrap = styled("div", { base: { mt: "3" } });

const Hint = styled("p", { base: { fontSize: "xs", color: "fg.subtle" } });

export function MacroPanel({ macros, onAdd, onRemove }: MacroPanelProps) {
  const [removeError, setRemoveError] = useState<string>();

  return (
    <Popover.Root positioning={{ placement: "bottom-end" }}>
      <Popover.Trigger asChild>
        <Button variant="plain" size="sm">
          매크로 {macros.length} <ChevronDown />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner>
          <Popover.Content>
            <Content>
              <Popover.Title>매크로</Popover.Title>
              <List aria-label="매크로 목록">
                {macros.map((macro) => (
                  <Row key={macro.id} aria-label={macro.name}>
                    <div>
                      {macro.name}
                      <Definition>{macro.definition}</Definition>
                    </div>
                    <Button
                      variant="plain"
                      size="xs"
                      aria-label={`${macro.name} 삭제`}
                      title={`${macro.name} 삭제`}
                      onClick={async () => setRemoveError(await onRemove(macro.id))}
                    >
                      <Trash2 />
                    </Button>
                  </Row>
                ))}
              </List>
              {removeError && (
                <RemoveError role="alert" aria-label={removeError}>
                  {removeError}
                </RemoveError>
              )}
              <AddWrap>
                <SimpleForm
                  aria-label="매크로 추가"
                  schema={AddSchema}
                  defaultValues={{ name: "", definition: "" }}
                  resetOnSuccess={["name", "definition"]}
                  onSubmit={onAdd}
                >
                  <SimpleInput name="name" label="매크로 이름" placeholder="행동 판정" />
                  <SimpleTextarea
                    name="definition"
                    label="매크로 식"
                    rows={3}
                    placeholder="d6+{능력치:1..4} max10 > 2d10 => 0 실패 | 1 약한 성공 | 2 강한 성공"
                  />
                  <Hint>
                    빈칸은 {"{이름:최소..최대}"}, 결과 이름은 {"=> 범위 이름 | ..."}, 눈 효과는{" "}
                    {"; 범위 [!]이름, ..."}
                  </Hint>
                  <SubmitButton variant="subtle" aria-label="매크로 추가">
                    <Plus /> 추가
                  </SubmitButton>
                </SimpleForm>
              </AddWrap>
            </Content>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
