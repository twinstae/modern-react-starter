import type { Meta, StoryObj } from "@storybook/react-vite";

import { ORACLE_ACTION, ORACLE_FIXTURES, ORACLE_TROUBLE } from "../domain/oracle.fixture.ts";
import { DEFAULT_CHARACTERS, type OracleMacro } from "../domain/session.ts";
import { OraclePanel } from "./oracle-panel.tsx";

const meta = {
  component: OraclePanel,
} satisfies Meta<typeof OraclePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const callbacks = {
  onRoll: async (values: unknown) => {
    console.log(values);
    return undefined;
  },
  onAddMacro: async (oracleId: string) => {
    console.log(oracleId);
    return undefined;
  },
  onRemoveMacro: async (macroId: string) => {
    console.log(macroId);
    return undefined;
  },
};

export const Empty: Story = {
  args: { oracles: [], macros: [], characters: DEFAULT_CHARACTERS, ...callbacks },
};

export const Seeded: Story = {
  args: {
    oracles: ORACLE_FIXTURES,
    macros: [],
    characters: DEFAULT_CHARACTERS,
    ...callbacks,
  },
};

/** 경비병 캐릭터와, `행동` 오라클을 매크로로 등록한 세션. */
export const WithMacro: Story = {
  args: {
    oracles: ORACLE_FIXTURES,
    macros: [{ id: "om-1", oracleId: "action" } satisfies OracleMacro],
    characters: [
      ...DEFAULT_CHARACTERS,
      { id: "guard", name: "경비병", archived: false, isDefault: false },
    ],
    ...callbacks,
  },
};

/** 표 하나만 있는 목록. */
export const One: Story = {
  args: {
    oracles: [ORACLE_ACTION, ORACLE_TROUBLE].slice(0, 1),
    macros: [],
    characters: DEFAULT_CHARACTERS,
    ...callbacks,
  },
};
