import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { PublishPanel } from "./publish-panel.tsx";

const drawerNames = new Map([
  ["a", "삶의 방식을 바꾸는 책"],
  ["b", "나를 들여다보는 책"],
]);

export const publishPanelArgs = {
  blocked: {
    check: {
      canPublish: false,
      failures: [{ code: "empty-drawer", drawers: ["b"] }],
      warnings: [],
    },
    drawerNames,
    currentVersion: null,
    onPublish: () => {},
  },
  warning: {
    check: {
      canPublish: true,
      failures: [],
      warnings: [{ code: "few-books", drawers: ["a"] }],
    },
    drawerNames,
    currentVersion: 2,
    onPublish: () => {},
  },
  published: {
    check: { canPublish: true, failures: [], warnings: [] },
    drawerNames,
    currentVersion: 3,
    result: { ok: true, version: 3 },
    onPublish: () => {},
  },
} satisfies Record<string, ComponentProps<typeof PublishPanel>>;

const meta = {
  component: PublishPanel,
  args: publishPanelArgs.warning,
} satisfies Meta<typeof PublishPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Blocked: Story = { args: publishPanelArgs.blocked };

export const Warning: Story = { args: publishPanelArgs.warning };

export const Published: Story = { args: publishPanelArgs.published };
