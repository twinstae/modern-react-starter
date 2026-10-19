import type { Meta, StoryObj } from "@storybook/react-vite";

import { ORACLE_ACTION } from "../domain/oracle.fixture.ts";
import { OracleEditor } from "./oracle-editor.tsx";

const meta = {
  component: OracleEditor,
} satisfies Meta<typeof OracleEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

const callbacks = {
  onClose: () => {},
  onSave: async () => undefined,
};

/** 새 오라클. 이름은 비어 있고 1부터 100까지 한 줄이 있다. */
export const New: Story = { args: { open: true, ...callbacks } };

/** 이미 있는 표를 고치는 중. */
export const Existing: Story = { args: { open: true, oracle: ORACLE_ACTION, ...callbacks } };
