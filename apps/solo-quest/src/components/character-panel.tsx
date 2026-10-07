import { Collapsible } from "@repo/ui";
import { ChevronDown } from "lucide-react";

import type { Character } from "../domain/session.ts";

interface CharacterPanelProps {
  /** 모든 캐릭터. 활성과 보관은 `archived`로 나눈다. */
  characters: Character[];
}

export function CharacterPanel({ characters }: CharacterPanelProps) {
  const active = characters.filter((character) => !character.archived);

  return (
    <Collapsible.Root>
      <Collapsible.Trigger>
        캐릭터 {active.length} <ChevronDown />
      </Collapsible.Trigger>
      <Collapsible.Content>
        <ul aria-label="활성 캐릭터">
          {active.map((character) => (
            <li key={character.id} aria-label={character.name}>
              {character.name}
            </li>
          ))}
        </ul>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
