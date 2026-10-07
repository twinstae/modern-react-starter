import { Field } from "@ark-ui/react";
import type { ComponentProps } from "react";
import { styled } from "styled-system/jsx";
import { input } from "styled-system/recipes";

export type NativeSelectProps = ComponentProps<typeof NativeSelect>;
/** 브라우저 기본 select. Field.Root 안에서 Field.Label과 이어진다. */
export const NativeSelect = styled(Field.Select, input);
