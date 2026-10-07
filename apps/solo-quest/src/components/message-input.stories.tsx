import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEFAULT_CHARACTERS } from "../domain/session.ts";
import { MessageInput } from "./message-input.tsx";

const meta = {
  component: MessageInput,
} satisfies Meta<typeof MessageInput>;

export default meta;
type Story = StoryObj<typeof meta>;

const callbacks = {
  onSpeakerChange: () => {},
  onSubmit: async (values: unknown) => {
    console.log(values);
    return undefined;
  },
};

export const Master: Story = {
  args: { side: "master", characters: DEFAULT_CHARACTERS, speakerId: "gm", ...callbacks },
};
export const Player: Story = {
  args: { side: "player", characters: DEFAULT_CHARACTERS, speakerId: "player", ...callbacks },
};
