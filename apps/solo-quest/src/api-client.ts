import { treaty } from "@elysiajs/eden";

import type { App } from "./server/app.ts";

export const api = treaty<App>(
  typeof window === "undefined" ? "localhost" : window.location.origin,
).api;
