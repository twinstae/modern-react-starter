import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { DEFAULT_CHARACTERS, type Character, type Side } from "../domain/session.ts";
import { MessageInput } from "./message-input.tsx";

const meta = {
  component: MessageInput,
  // 스토리가 아니라 스토리와 테스트가 함께 쓰는 컴포넌트
  excludeStories: ["GuardGetsArchived"],
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

/**
 * 입력창이 보는 중에 경비병이 보관되는 상황. 보관은 화면 밖(세션)의 일이라 버튼으로 흉내 낸다.
 * 경비병을 화자로 골라 두고 버튼을 누르면 화자가 그 편의 기본 캐릭터로 돌아간다.
 */
export function GuardGetsArchived({ side }: { side: Side }) {
  const [characters, setCharacters] = useState<Character[]>(WithArchived.args.characters);
  return (
    <>
      <MessageInput side={side} characters={characters} onSubmit={callbacks.onSubmit} />
      <button
        type="button"
        onClick={() =>
          setCharacters(characters.map((c) => (c.id === "guard" ? { ...c, archived: true } : c)))
        }
      >
        경비병 보관
      </button>
    </>
  );
}

export const SpeakerArchivedWhileSelected: Story = {
  args: WithArchived.args,
  render: (args) => <GuardGetsArchived side={args.side} />,
};
