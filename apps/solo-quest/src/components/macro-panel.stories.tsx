import type { Meta, StoryObj } from "@storybook/react-vite";

import { SYSTEM_MACRO_LIST } from "../domain/macro.fixture.ts";
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

export const Empty: Story = { args: { macros: [], ...callbacks } };

export const Systems: Story = { args: { macros: SYSTEM_MACRO_LIST, ...callbacks } };
