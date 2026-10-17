import {
  Button,
  Popover,
  SimpleForm,
  SimpleInput,
  SimpleSelect,
  SubmitButton,
  useSimpleField,
} from "@repo/ui";
import { Dices } from "lucide-react";
import { useState } from "react";
import { styled } from "styled-system/jsx";
import * as v from "valibot";

import { parseMacro, type Slot } from "../domain/macro.ts";
import type { Macro, Side } from "../domain/session.ts";

/** 매크로로 굴릴 때 넘기는 값. 라벨을 비우면 생략한다. */
export interface MacroRollValues {
  side: Side;
  /** 화자 캐릭터 id */
  as: string;
  macroId: string;
  /** 빈칸 이름마다 고른 값 */
  values: Record<string, number>;
  label?: string;
}

/** 빈칸 이름에 점이나 대괄호가 있어도 폼 필드 이름이 경로로 읽히지 않게 순서로 이름을 붙인다. */
const fieldName = (index: number) => `slot${index}`;

const slotItems = (slot: Slot) =>
  Array.from({ length: slot.max - slot.min + 1 }, (_, i) => String(slot.min + i)).map((value) => ({
    label: value,
    value,
  }));

const Slots = styled("div", { base: { display: "flex", flexWrap: "wrap", gap: "2" } });

const SlotField = styled("div", { base: { width: "24" } });

/**
 * 매크로 하나를 굴리는 버튼. 누르면 빈칸마다 고르는 칸과 라벨이 있는 폼이 뜬다.
 * 입력창 폼 안에 두어, 입력창에서 고른 화자로 굴린다. 폼은 Portal로 뜨지만 React 트리에서는
 * 입력창 폼 안이라, 제출이 입력창 폼까지 올라가지 않는 것은 SimpleForm이 막는다.
 */
export function MacroButton({
  side,
  macro,
  onRoll,
}: {
  side: Side;
  macro: Macro;
  /** 오류 메시지를 돌려주면 폼을 연 채 보여 준다. 성공하면 폼이 닫힌다. */
  onRoll: (values: MacroRollValues) => Promise<string | undefined>;
}) {
  const [speakerId] = useSimpleField("as");
  const [open, setOpen] = useState(false);
  const parsed = parseMacro(macro.definition);
  // 등록할 때 확인한 식이라 틀릴 일은 없지만, 틀리면 굴릴 수 없으니 버튼을 두지 않는다
  if (!parsed.ok) return null;
  const { slots } = parsed.macro;

  const schema = v.object({
    ...Object.fromEntries(slots.map((_, index) => [fieldName(index), v.string()])),
    label: v.pipe(v.string(), v.trim()),
  });

  return (
    <Popover.Root open={open} onOpenChange={(details) => setOpen(details.open)}>
      <Popover.Trigger asChild>
        <Button variant="outline" size="xs">
          <Dices /> {macro.name}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Title>{macro.name}</Popover.Title>
            <SimpleForm
              aria-label={`${macro.name} 굴리기`}
              schema={schema}
              defaultValues={{
                ...Object.fromEntries(
                  slots.map((slot, index) => [fieldName(index), String(slot.min)]),
                ),
                label: "",
              }}
              onSubmit={async (form: Record<string, string>) => {
                const { label } = form;
                const message = await onRoll({
                  side,
                  as: String(speakerId),
                  macroId: macro.id,
                  values: Object.fromEntries(
                    slots.map((slot, index) => [slot.name, Number(form[fieldName(index)])]),
                  ),
                  ...(label && { label }),
                });
                if (!message) setOpen(false);
                return message;
              }}
            >
              {slots.length > 0 && (
                <Slots>
                  {slots.map((slot, index) => (
                    <SlotField key={slot.name}>
                      <SimpleSelect
                        name={fieldName(index)}
                        label={slot.name}
                        size="sm"
                        items={slotItems(slot)}
                      />
                    </SlotField>
                  ))}
                </Slots>
              )}
              <SimpleInput name="label" label="판정 라벨" placeholder={macro.name} />
              <SubmitButton>굴리기</SubmitButton>
            </SimpleForm>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
