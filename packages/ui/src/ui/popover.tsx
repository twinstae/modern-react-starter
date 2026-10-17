"use client";
import { Popover, Portal } from "@ark-ui/react";
import type { ComponentProps } from "react";
import { createSlotRecipeContext } from "styled-system/jsx";
import { popover } from "styled-system/recipes";

const { withRootProvider, withContext } = createSlotRecipeContext(popover);

// Popover.Root는 DOM 요소를 그리지 않으므로 레시피 문맥만 내려 준다
export type RootProps = ComponentProps<typeof Root>;
/**
 * 떠 있는 층의 쌓임 순서는 z-index가 아니라 DOM 순서로 정한다. 팝오버는 처음부터 body에 붙어 있고,
 * 안에서 여는 층(Select, Dialog)은 열 때 body 끝에 붙어 팝오버 위에 그려진다.
 * 팝오버를 열 때 그리면(lazyMount) Ark가 제목을 찾지 못해 aria-labelledby가 빠지므로 미리 그려 둔다.
 */
export const Root = withRootProvider(Popover.Root);
export const RootProvider = withRootProvider(Popover.RootProvider);
export const Anchor = withContext(Popover.Anchor, "anchor");
export const Trigger = withContext(Popover.Trigger, "trigger");
export const Indicator = withContext(Popover.Indicator, "indicator");
export const Positioner = withContext(Popover.Positioner, "positioner");
export const Content = withContext(Popover.Content, "content");
export const Title = withContext(Popover.Title, "title");
export const Description = withContext(Popover.Description, "description");
export const CloseTrigger = withContext(Popover.CloseTrigger, "closeTrigger");
export const Arrow = withContext(Popover.Arrow, "arrow");
export const ArrowTip = withContext(Popover.ArrowTip, "arrowTip");

export { PopoverContext as Context } from "@ark-ui/react";

export { Portal };
