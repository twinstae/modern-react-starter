import type { Meta, StoryObj } from "@storybook/react-vite";

import { NewSessionForm } from "./new-session-form.tsx";

const meta = {
  component: NewSessionForm,
} satisfies Meta<typeof NewSessionForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: async (values) => {
      console.log(values);
    },
  },
};
