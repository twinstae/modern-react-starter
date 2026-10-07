import { Button, Popover, SimpleForm, SimpleInput, SubmitButton } from "@repo/ui";
import { Archive, ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { styled } from "styled-system/jsx";
import * as v from "valibot";

import { activeCharacters, type Character } from "../domain/session.ts";
import { ShortText } from "../domain/short-text.ts";

const AddSchema = v.object({ name: ShortText });

interface CharacterPanelProps {
  /** 모든 캐릭터. 활성과 보관은 `archived`로 나눈다. */
  characters: Character[];
  /** 캐릭터를 추가한다. 오류 메시지를 돌려주면 보여 준다. */
  onAdd: (values: { name: string }) => Promise<string | undefined>;
  /** 캐릭터를 보관한다. 오류 메시지를 돌려주면 보여 준다. */
  onArchive: (characterId: string) => Promise<string | undefined>;
}

const List = styled("ul", {
  base: { display: "flex", flexDirection: "column", gap: "1", listStyle: "none", p: "0" },
});

const Row = styled("li", {
  base: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "2" },
});

/** 보관된 캐릭터는 덜 중요한 정보라 작고 흐리게, 활성 캐릭터 아래에 보인다. */
const Archived = styled("ul", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5",
    listStyle: "none",
    mt: "3",
    p: "0",
    fontSize: "sm",
    color: "fg.subtle",
  },
});

const ArchiveError = styled("p", { base: { mt: "2", fontSize: "sm", color: "error" } });

const AddWrap = styled("div", { base: { mt: "3" } });

const AddRow = styled("div", { base: { display: "flex", gap: "2", alignItems: "flex-start" } });

export function CharacterPanel({ characters, onAdd, onArchive }: CharacterPanelProps) {
  const active = activeCharacters(characters);
  const archived = characters.filter((character) => character.archived);
  const [archiveError, setArchiveError] = useState<string>();

  return (
    // 패널은 트리거 옆에 떠서 로그와 입력창을 밀어내지 않고, 바깥을 누르거나 Esc로 닫힌다
    <Popover.Root positioning={{ placement: "bottom-end" }}>
      <Popover.Trigger asChild>
        <Button variant="plain" size="sm">
          캐릭터 {active.length} <ChevronDown />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Title>캐릭터</Popover.Title>
            <List aria-label="활성 캐릭터">
              {active.map((character) => (
                <Row key={character.id} aria-label={character.name}>
                  {character.name}
                  {!character.isDefault && (
                    <Button
                      variant="plain"
                      size="xs"
                      aria-label={`${character.name} 보관`}
                      title={`${character.name} 보관`}
                      onClick={async () => setArchiveError(await onArchive(character.id))}
                    >
                      <Archive />
                    </Button>
                  )}
                </Row>
              ))}
            </List>
            {archiveError && (
              <ArchiveError role="alert" aria-label={archiveError}>
                {archiveError}
              </ArchiveError>
            )}
            {archived.length > 0 && (
              <Archived aria-label="보관된 캐릭터">
                {archived.map((character) => (
                  <li key={character.id}>{character.name}</li>
                ))}
              </Archived>
            )}
            <AddWrap>
              <SimpleForm
                aria-label="캐릭터 추가"
                schema={AddSchema}
                defaultValues={{ name: "" }}
                resetOnSuccess={["name"]}
                onSubmit={onAdd}
              >
                <AddRow>
                  <SimpleInput
                    name="name"
                    label="캐릭터 이름"
                    hideLabel
                    placeholder="새 캐릭터 이름"
                  />
                  <SubmitButton variant="subtle" aria-label="캐릭터 추가" title="캐릭터 추가">
                    <Plus />
                  </SubmitButton>
                </AddRow>
              </SimpleForm>
            </AddWrap>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
