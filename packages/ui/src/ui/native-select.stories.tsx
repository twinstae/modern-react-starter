import type { Meta, StoryObj } from "@storybook/react-vite";

import { NativeSelect } from "./native-select.tsx";

const meta = {
  title: "UI/NativeSelect",
  component: NativeSelect,
  args: {
    "aria-label": "화자",
    children: (
      <>
        <option value="gm">GM</option>
        <option value="player">Player</option>
      </>
    ),
  },
} satisfies Meta<typeof NativeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Disabled: Story = {
  args: { disabled: true },
};
