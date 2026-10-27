/// <reference types="vite-plus" />
import { defineConfig } from "vite-plus";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import contentCollections from "@content-collections/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { playwright } from "vite-plus/test/browser-playwright";
import { lazyPlugins } from "vite-plus";
const dirname =
  typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: lazyPlugins(() => [
    devtools(),
    cloudflare({
      viteEnvironment: {
        name: "ssr",
      },
    }),
    contentCollections(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ]),
  test: {
    projects: [
    ],
  },
});
export default config;
