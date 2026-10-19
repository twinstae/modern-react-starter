import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { SYSTEM_MACRO_LIST } from "../domain/macro.fixture.ts";
import { ORACLE_FIXTURES } from "../domain/oracle.fixture.ts";
import { DEFAULT_CHARACTERS, type Character, type Side } from "../domain/session.ts";
import { MessageInput, type MessageInputProps } from "./message-input.tsx";

const meta = {
  component: MessageInput,
  // 스토리가 아니라 스토리와 테스트가 함께 쓰는 컴포넌트
  excludeStories: ["GuardGetsArchived", "RestoredLater"],
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

/** 다섯 시스템의 매크로 버튼이 있는 플레이어 입력창 */
export const WithMacros: Story = {
  args: {
    side: "player",
    characters: [
      ...DEFAULT_CHARACTERS,
      { id: "guard", name: "경비병", archived: false, isDefault: false },
    ],
    macros: SYSTEM_MACRO_LIST,
    onRollMacro: async (values) => {
      console.log(values);
      return undefined;
    },
    ...callbacks,
  },
};

/** `행동` 오라클을 매크로로 등록한 플레이어 입력창. 화자 옆에 오라클 버튼이 있다. */
export const WithOracles: Story = {
  args: {
    side: "player",
    characters: [
      ...DEFAULT_CHARACTERS,
      { id: "guard", name: "경비병", archived: false, isDefault: false },
    ],
    oracleMacros: [{ id: "om-1", oracleId: "action" }],
    oracles: ORACLE_FIXTURES,
    onRollOracle: async (values) => {
      console.log(values);
      return undefined;
    },
    ...callbacks,
  },
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

/** 충돌로 버려진 제출의 글과 화자가 처음부터 돌아와 있다 */
export const Restored: Story = {
  args: {
    ...WithArchived.args,
    restored: { key: 1, as: "guard", text: "되돌아온 글" },
  },
};

/**
 * 입력하는 중에 충돌이 나서 글이 돌아오는 상황. 충돌은 화면 밖(세션)의 일이라 버튼으로 흉내 낸다.
 * 입력창이 비어 있을 때만 돌아온 글이 채워지고, 새로 쓰던 글은 덮이지 않는다.
 */
export function RestoredLater({ side }: { side: Side }) {
  const [restored, setRestored] = useState<MessageInputProps["restored"]>();
  return (
    <>
      <MessageInput
        side={side}
        characters={WithArchived.args.characters}
        restored={restored}
        onSubmit={callbacks.onSubmit}
      />
      <button
        type="button"
        onClick={() =>
          setRestored({ key: (restored?.key ?? 0) + 1, as: "guard", text: "되돌아온 글" })
        }
      >
        글 되돌리기
      </button>
    </>
  );
}

export const RestoredWhileTyping: Story = {
  args: WithArchived.args,
  render: (args) => <RestoredLater side={args.side} />,
};
