import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEFAULT_CHARACTERS, type Character } from "../domain/session.ts";
import { CharacterPanel } from "./character-panel.tsx";

const meta = {
  component: CharacterPanel,
} satisfies Meta<typeof CharacterPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const added = (n: number, archived = false): Character => ({
  id: `npc-${n}`,
  name: `캐릭터 ${n}`,
  archived,
  isDefault: false,
});

export const DefaultOnly: Story = { args: { characters: DEFAULT_CHARACTERS } };

export const One: Story = {
  args: { characters: [...DEFAULT_CHARACTERS, { ...added(1), name: "경비병" }] },
};

export const Ten: Story = {
  args: {
    characters: [...DEFAULT_CHARACTERS, ...Array.from({ length: 8 }, (_, i) => added(i + 1))],
  },
};

/** 보관된 캐릭터 상인과 경비병(이름이 같은 새 캐릭터)이 섞여 있다. */
export const WithArchived: Story = {
  args: {
    characters: [
      ...DEFAULT_CHARACTERS,
      { id: "guard-1", name: "경비병", archived: true, isDefault: false },
      { id: "merchant", name: "상인", archived: false, isDefault: false },
      { id: "guard-2", name: "경비병", archived: false, isDefault: false },
    ],
  },
};
