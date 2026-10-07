"use client";
import {
  Portal,
  Select,
  createListCollection,
  type CollectionItem,
  type ListCollection,
} from "@ark-ui/react";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import type { ComponentProps, ReactElement } from "react";
import { createSlotRecipeContext } from "styled-system/jsx";
import { select } from "styled-system/recipes";

const { withProvider, withContext } = createSlotRecipeContext(select);

const RootBase = withProvider(Select.Root, "root");

export type RootProps<T extends CollectionItem = CollectionItem> = Omit<
  ComponentProps<typeof RootBase>,
  "collection"
> & { collection: ListCollection<T> };

// withProvider는 Ark Select.Root의 제네릭(항목 타입)을 지우므로, 항목 타입을 collection에서 되살린다.
export const Root = RootBase as <T extends CollectionItem>(props: RootProps<T>) => ReactElement;
export const RootProvider = withProvider(Select.RootProvider, "root");
export const Label = withContext(Select.Label, "label");
export const Control = withContext(Select.Control, "control");
export const Trigger = withContext(Select.Trigger, "trigger");
export const ValueText = withContext(Select.ValueText, "valueText");
export const Indicator = withContext(Select.Indicator, "indicator");
export const Positioner = withContext(Select.Positioner, "positioner");
export const Content = withContext(Select.Content, "content");
export const Item = withContext(Select.Item, "item");
export const ItemText = withContext(Select.ItemText, "itemText");
export const ItemIndicator = withContext(Select.ItemIndicator, "itemIndicator");
export const ItemGroup = withContext(Select.ItemGroup, "itemGroup");
export const ItemGroupLabel = withContext(Select.ItemGroupLabel, "itemGroupLabel");
/** 폼 제출용 숨은 select. 보이는 트리거와 따로 FormData에 값을 싣는다. */
export const HiddenSelect = Select.HiddenSelect;

export { createListCollection, Portal };
export { SelectContext as Context } from "@ark-ui/react";

/** 트리거 오른쪽의 화살표 */
export function ChevronIndicator() {
  return (
    <Indicator>
      <ChevronDownIcon />
    </Indicator>
  );
}

/** 선택된 항목 표시 */
export function CheckIndicator() {
  return (
    <ItemIndicator>
      <CheckIcon />
    </ItemIndicator>
  );
}
