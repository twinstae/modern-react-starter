import type { Meta, StoryObj } from "@storybook/react-vite";
import { XIcon } from "lucide-react";

import * as v from "valibot";

import { SimpleSelect } from "../form/simple-field.tsx";
import { SimpleForm } from "../form/simple-form.tsx";
import * as Popover from "./popover.tsx";
import { Button } from "./button.tsx";
import { IconButton } from "./icon-button.tsx";

const NumberSchema = v.object({ number: v.string() });

/** 팝오버 안의 고르는 칸. 펼친 목록이 팝오버의 아래 내용과 겹친다. */
function SelectInside() {
  return (
    <SimpleForm schema={NumberSchema} defaultValues={{ number: "1" }} onSubmit={async () => {}}>
      <SimpleSelect
        name="number"
        label="숫자"
        size="sm"
        items={["1", "2", "3", "4", "5"].map((value) => ({ label: value, value }))}
      />
    </SimpleForm>
  );
}

function PopoverExample({
  withSelect,
  ...props
}: Popover.RootProps & {
  /** 제목 아래에 고르는 칸을 둔다. */
  withSelect?: boolean;
}) {
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
              {withSelect && <SelectInside />}
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

/** 팝오버 안에서 연 고르는 칸의 목록은 팝오버 위에 뜬다. */
export const WithSelect: Story = { args: { withSelect: true } };

/** 넓은 내용(긴 식, 여러 칸)을 담는 팝오버 */
export const Wide: Story = { args: { size: "md" } };
