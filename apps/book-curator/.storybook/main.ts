import type { StorybookConfig } from "@storybook/react-vite";
import type { PluginOption } from "vite";

import { fakeAliases } from "../fake-aliases.ts";

// 앱 vite 설정의 TanStack Start, nitro 플러그인은 서버 앱을 만들기 위한 것이라 Storybook 빌드를 깨뜨린다.
const isAppServerPlugin = (plugin: PluginOption) =>
  !!plugin &&
  typeof plugin === "object" &&
  "name" in plugin &&
  /^(tanstack|nitro)/.test(plugin.name);

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: "@storybook/react-vite",
  async viteFinal(config) {
    config.plugins = (config.plugins ?? [])
      .flat(Infinity as 1)
      .filter((p) => !isAppServerPlugin(p));
    // 컴포넌트 테스트와 같은 가짜 구현체를 연결한다
    const existing = config.resolve?.alias ?? [];
    config.resolve = {
      ...config.resolve,
      alias: [
        ...fakeAliases,
        ...(Array.isArray(existing)
          ? existing
          : Object.entries(existing).map(([find, replacement]) => ({ find, replacement }))),
      ],
    };
    return config;
  },
};
export default config;
