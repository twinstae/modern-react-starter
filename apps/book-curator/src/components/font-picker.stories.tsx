import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import type { FontId } from "../lib/font-preference.ts";
import { FontPicker } from "./font-picker.tsx";

/** 실제 화면처럼 고른 글꼴을 카드 안에 바로 적용해 본다. */
function FontPickerDemo({ value: initial }: { value: FontId }) {
  const [value, setValue] = useState(initial);

  return (
    <div data-font={value}>
      <FontPicker value={value} onChange={setValue} />
    </div>
  );
}

export const fontPickerArgs = {
  kimyui: { value: "kimyui", onChange: () => {} },
  microorganism: { value: "microorganism", onChange: () => {} },
  noto: { value: "noto", onChange: () => {} },
} satisfies Record<string, { readonly value: FontId; readonly onChange: (id: FontId) => void }>;

const meta = {
  component: FontPicker,
  args: fontPickerArgs.kimyui,
  render: ({ value }) => <FontPickerDemo value={value} />,
} satisfies Meta<typeof FontPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Kimyui: Story = { args: fontPickerArgs.kimyui };

export const Microorganism: Story = { args: fontPickerArgs.microorganism };

export const Noto: Story = { args: fontPickerArgs.noto };
