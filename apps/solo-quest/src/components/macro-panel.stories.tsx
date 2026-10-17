import type { Meta, StoryObj } from "@storybook/react-vite";

import { SYSTEM_MACROS } from "../domain/macro.fixture.ts";
import type { Macro } from "../domain/session.ts";
import { MacroPanel } from "./macro-panel.tsx";

const meta = {
  component: MacroPanel,
} satisfies Meta<typeof MacroPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const callbacks = {
  onAdd: async (values: unknown) => {
    console.log(values);
    return undefined;
  },
  onRemove: async (macroId: string) => {
    console.log(macroId);
    return undefined;
  },
};

/** 다섯 시스템의 매크로 */
export const SYSTEM_MACRO_LIST: Macro[] = [
  { id: "ironsworn", name: "행동 판정", definition: SYSTEM_MACROS.ironsworn },
  { id: "cypher", name: "과제 판정", definition: SYSTEM_MACROS.cypher },
  { id: "gurps", name: "성공 판정", definition: SYSTEM_MACROS.gurps },
  { id: "fate", name: "Fate 행동", definition: SYSTEM_MACROS.fate },
  { id: "dungeon-world", name: "위험을 무릅쓰기", definition: SYSTEM_MACROS.dungeonWorld },
];

export const Empty: Story = { args: { macros: [], ...callbacks } };

export const Systems: Story = { args: { macros: SYSTEM_MACRO_LIST, ...callbacks } };
