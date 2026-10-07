import type { Meta, StoryObj } from "@storybook/react-vite";

import * as Select from "./select.tsx";

const items = [
  { label: "GM", value: "gm" },
  { label: "Player", value: "player" },
  { label: "상인", value: "merchant" },
];
const collection = Select.createListCollection({ items });

function SelectExample(props: Omit<Select.RootProps, "collection">) {
  return (
    <Select.Root collection={collection} {...props}>
      <Select.Label>화자</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText placeholder="화자를 고르세요" />
          <Select.ChevronIndicator />
        </Select.Trigger>
      </Select.Control>
      <Select.Portal>
        <Select.Positioner>
          <Select.Content>
            {items.map((item) => (
              <Select.Item key={item.value} item={item}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.CheckIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Select.Portal>
      <Select.HiddenSelect />
    </Select.Root>
  );
}

const meta = {
  title: "UI/Select",
  component: SelectExample,
} satisfies Meta<typeof SelectExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithValue: Story = {
  args: { defaultValue: ["player"] },
};

export const Open: Story = {
  args: { defaultOpen: true },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: ["gm"] },
};

export const Invalid: Story = {
  args: { invalid: true },
};

export const Small: Story = {
  args: { size: "sm" },
};

export const Large: Story = {
  args: { size: "lg" },
};
