import "../src/styles.css";
import type { Preview } from "@storybook/react-vite";

// 이 앱의 기본 화면은 책방에 비치된 태블릿이다. 두 방향을 먼저 등록하고 세로를 기본으로 본다.
export const TABLET_VIEWPORTS = {
  tabletPortrait: {
    name: "Tablet portrait",
    styles: { width: "834px", height: "1112px" },
    type: "tablet",
  },
  tabletLandscape: {
    name: "Tablet landscape",
    styles: { width: "1112px", height: "834px" },
    type: "tablet",
  },
} as const;

const preview: Preview = {
  initialGlobals: {
    viewport: { value: "tabletPortrait" },
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },

    viewport: {
      options: TABLET_VIEWPORTS,
    },
  },
};

export default preview;
