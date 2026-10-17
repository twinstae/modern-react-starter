"use client";
import { Dialog, Portal } from "@ark-ui/react";
import type { ComponentProps } from "react";
import { createSlotRecipeContext } from "styled-system/jsx";
import { dialog } from "styled-system/recipes";

const { withProvider, withContext } = createSlotRecipeContext(dialog);

export type RootProps = ComponentProps<typeof Root>;
/**
 * 떠 있는 층의 쌓임 순서는 z-index가 아니라 DOM 순서로 정한다. 열 때 body 끝에 붙이고 닫으면 떼어,
 * 나중에 연 층(예: 팝오버 안의 고르는 칸)이 언제나 위에 그려진다.
 */
export const Root = withProvider(Dialog.Root, "root", {
  defaultProps: { lazyMount: true, unmountOnExit: true },
});
export const RootProvider = withProvider(Dialog.RootProvider, "root");
export const Trigger = withContext(Dialog.Trigger, "trigger");
export const Backdrop = withContext(Dialog.Backdrop, "backdrop");
export const Positioner = withContext(Dialog.Positioner, "positioner");
export const Content = withContext(Dialog.Content, "content");
export const Title = withContext(Dialog.Title, "title");
export const Description = withContext(Dialog.Description, "description");
export const CloseTrigger = withContext(Dialog.CloseTrigger, "closeTrigger");
export const Header = withContext("div", "header");
export const Body = withContext("div", "body");
export const Footer = withContext("div", "footer");

export { DialogContext as Context } from "@ark-ui/react";

export { Portal };
