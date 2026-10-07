import { Button, Collapsible, SimpleForm, SimpleInput, SubmitButton } from "@repo/ui";
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

// 닫혀 있으면 버튼 하나만 자리를 차지한다. 열면 아래에 겹쳐 떠서 로그와 입력창을 밀어내지 않는다.
const Anchor = styled("div", { base: { position: "relative" } });

const Floating = styled("div", {
  base: {
    position: "absolute",
    right: "0",
    top: "100%",
    zIndex: "dropdown",
    width: "64",
    maxHeight: "60dvh",
    overflowY: "auto",
    mt: "1",
    p: "3",
    bg: "bg.default",
    borderWidth: "1px",
    borderColor: "border",
    borderRadius: "l2",
    boxShadow: "lg",
  },
});

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
    <Collapsible.Root>
      <Anchor>
        <Collapsible.Trigger>
          캐릭터 {active.length} <ChevronDown />
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Floating>
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
          </Floating>
        </Collapsible.Content>
      </Anchor>
    </Collapsible.Root>
  );
}
