import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEFAULT_CHARACTERS, type Character } from "../domain/session.ts";
import { MessageInput } from "./message-input.tsx";

const meta = {
  component: MessageInput,
} satisfies Meta<typeof MessageInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const callbacks = {
  onSubmit: async (values: unknown) => {
    console.log(values);
    return undefined;
  },
};

export const Master: Story = {
  args: { side: "master", characters: DEFAULT_CHARACTERS, ...callbacks },
};
export const Player: Story = {
  args: { side: "player", characters: DEFAULT_CHARACTERS, ...callbacks },
};

/** 활성 캐릭터 경비병과 보관된 캐릭터 상인이 있다. 화자 목록에는 활성 캐릭터만 나온다. */
export const WithArchived: Story = {
  args: {
    side: "master",
    characters: [
      ...DEFAULT_CHARACTERS,
      { id: "guard", name: "경비병", archived: false, isDefault: false },
      { id: "merchant", name: "상인", archived: true, isDefault: false },
    ] satisfies Character[],
    ...callbacks,
  },
};
