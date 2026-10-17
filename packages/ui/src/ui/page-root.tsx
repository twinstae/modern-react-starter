import { ark } from "@ark-ui/react";
import type { ComponentProps } from "react";
import { styled } from "styled-system/jsx";

export type PageRootProps = ComponentProps<typeof PageRoot>;
/**
 * 앱 셸에서 body 안의 페이지 내용을 감싸는 층. 떠 있는 층(Popover, Select, Dialog)은 body 끝에 붙고
 * z-index 없이 DOM 순서로 쌓이므로, 페이지 내용이 그 뒤에 붙으면 말풍선처럼 position이 있는 요소가
 * 떠 있는 층을 가린다. 클라이언트 이동으로 새 페이지가 그려질 때 React는 포털 내용을 먼저 body에
 * 붙이고 페이지를 그 뒤에 붙인다. 셸에서 한 번 붙는 이 층 안에 페이지를 두면 페이지는 언제나 떠 있는
 * 층 앞에 있고, isolation으로 페이지 안의 z-index가 이 층 밖으로 새지 않는다.
 */
export const PageRoot = styled(ark.div, { base: { isolation: "isolate" } });
