import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";

import { DeviceDataPanel } from "./device-data-panel.tsx";

const noop = () => {};

export const deviceDataPanelArgs = {
  recordCounts: { events: 128, handovers: 9 },
  currentDrawerCount: 7,
  onDownloadRecords: noop,
  onDownloadDrawers: noop,
  onImportDrawers: async () => undefined,
} satisfies ComponentProps<typeof DeviceDataPanel>;

const meta = {
  component: DeviceDataPanel,
  args: deviceDataPanelArgs,
} satisfies Meta<typeof DeviceDataPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: deviceDataPanelArgs,
};

export const Empty: Story = {
  args: { ...deviceDataPanelArgs, recordCounts: { events: 0, handovers: 0 } },
};
