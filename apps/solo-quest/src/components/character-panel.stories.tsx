import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEFAULT_CHARACTERS, type Character } from "../domain/session.ts";
import { CharacterPanel } from "./character-panel.tsx";

const meta = {
  component: CharacterPanel,
} satisfies Meta<typeof CharacterPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const callbacks = {
  onAdd: async (values: unknown) => {
    console.log(values);
    return undefined;
  },
  onArchive: async (characterId: string) => {
    console.log(characterId);
    return undefined;
  },
};

const added = (n: number, archived = false): Character => ({
  id: `npc-${n}`,
  name: `캐릭터 ${n}`,
  archived,
  isDefault: false,
});

export const DefaultOnly: Story = { args: { characters: DEFAULT_CHARACTERS, ...callbacks } };

export const One: Story = {
  args: { characters: [...DEFAULT_CHARACTERS, { ...added(1), name: "경비병" }], ...callbacks },
};

export const Ten: Story = {
  args: {
    characters: [...DEFAULT_CHARACTERS, ...Array.from({ length: 8 }, (_, i) => added(i + 1))],
    ...callbacks,
  },
};

/** 보관된 경비병(guard-1)과, 같은 이름으로 새로 추가한 경비병(guard-2), 상인이 섞여 있다. */
export const WithArchived: Story = {
  args: {
    characters: [
      ...DEFAULT_CHARACTERS,
      { id: "guard-1", name: "경비병", archived: true, isDefault: false },
      { id: "merchant", name: "상인", archived: false, isDefault: false },
      { id: "guard-2", name: "경비병", archived: false, isDefault: false },
    ],
    ...callbacks,
  },
};
