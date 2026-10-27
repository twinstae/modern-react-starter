import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { DeleteDrawerButton } from "./delete-drawer-button.tsx";

export const deleteDrawerButtonArgs: ComponentProps<typeof DeleteDrawerButton> = {
  drawerName: "삶의 방식을 바꾸는 책",
  bookCount: 3,
  onDelete: () => {},
};

const meta = {
  component: DeleteDrawerButton,
  args: deleteDrawerButtonArgs,
} satisfies Meta<typeof DeleteDrawerButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 누르면 지울지 묻는 경고 창이 열린다. */
export const Default: Story = {};
