import type { Meta, StoryObj } from "@storybook/react-vite";

import { ORACLE_FIXTURES } from "../domain/oracle.fixture.ts";
import { OracleManager } from "./oracle-manager.tsx";

const meta = {
  component: OracleManager,
} satisfies Meta<typeof OracleManager>;

export default meta;
type Story = StoryObj<typeof meta>;

const callbacks = {
  onSave: async (oracle: unknown) => {
    console.log(oracle);
    return undefined;
  },
  onRemove: async (oracleId: string) => {
    console.log(oracleId);
    return undefined;
  },
};

export const Seeded: Story = { args: { oracles: ORACLE_FIXTURES, ...callbacks } };

export const Empty: Story = { args: { oracles: [], ...callbacks } };
