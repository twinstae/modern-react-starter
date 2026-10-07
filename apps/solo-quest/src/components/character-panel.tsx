import { Button, Collapsible } from "@repo/ui";
import { Archive, ChevronDown } from "lucide-react";
import { styled } from "styled-system/jsx";

import type { Character } from "../domain/session.ts";

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

export function CharacterPanel({ characters, onArchive }: CharacterPanelProps) {
  const active = characters.filter((character) => !character.archived);

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
                      onClick={() => onArchive(character.id)}
                    >
                      <Archive />
                    </Button>
                  )}
                </Row>
              ))}
            </List>
          </Floating>
        </Collapsible.Content>
      </Anchor>
    </Collapsible.Root>
  );
}
