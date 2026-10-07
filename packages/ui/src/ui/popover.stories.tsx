import type { Meta, StoryObj } from "@storybook/react-vite";
import { XIcon } from "lucide-react";

import * as Popover from "./popover.tsx";
import { Button } from "./button.tsx";
import { IconButton } from "./icon-button.tsx";

function PopoverExample(props: Popover.RootProps) {
  return (
    <>
      {/* 팝오버는 트리거 아래로 펼쳐지므로, 바깥 클릭을 보이는 버튼은 위에 둔다 */}
      <Button variant="plain">바깥 버튼</Button>
      <Popover.Root {...props}>
        <Popover.Trigger asChild>
          <Button variant="outline">팝오버 열기</Button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner>
            <Popover.Content>
              <Popover.Arrow>
                <Popover.ArrowTip />
              </Popover.Arrow>
              <Popover.Title>팝오버 제목</Popover.Title>
              <Popover.Description>
                트리거 옆에 떠서 다른 내용을 밀어내지 않습니다.
              </Popover.Description>
              <Button size="sm">안의 버튼</Button>
              <Popover.CloseTrigger asChild>
                <IconButton variant="plain" size="xs" aria-label="닫기">
                  <XIcon />
                </IconButton>
              </Popover.CloseTrigger>
            </Popover.Content>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}

const meta = {
  title: "UI/Popover",
  component: PopoverExample,
} satisfies Meta<typeof PopoverExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: {} };
