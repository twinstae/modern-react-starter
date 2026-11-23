import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { AdminLogin } from "./admin-login.tsx";

const noop = () => {};
const submit = async () => undefined;

export const adminLoginArgs = {
  mode: "sign-in",
  onSubmit: submit,
  onSuccess: noop,
} satisfies ComponentProps<typeof AdminLogin>;

export const adminSetupArgs = {
  ...adminLoginArgs,
  mode: "setup",
} satisfies ComponentProps<typeof AdminLogin>;

const meta = {
  component: AdminLogin,
  args: adminLoginArgs,
} satisfies Meta<typeof AdminLogin>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignIn: Story = {
  args: adminLoginArgs,
};

export const Setup: Story = {
  args: adminSetupArgs,
};

export const Error: Story = {
  args: {
    ...adminLoginArgs,
    initialError: "비밀번호가 맞지 않아요",
  },
};
