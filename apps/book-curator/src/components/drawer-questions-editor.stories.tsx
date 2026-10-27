import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { SEED_DRAWERS } from "../domain/seed-question-set.ts";
import { DrawerQuestionsEditor } from "./drawer-questions-editor.tsx";

export const drawerQuestionsEditorArgs = {
  questions: SEED_DRAWERS[0]?.questions ?? [],
  onSave: async () => undefined,
} satisfies ComponentProps<typeof DrawerQuestionsEditor>;

const meta = {
  component: DrawerQuestionsEditor,
  args: drawerQuestionsEditorArgs,
} satisfies Meta<typeof DrawerQuestionsEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoQuestions: Story = {};

export const Empty: Story = {
  args: { questions: [] },
};
