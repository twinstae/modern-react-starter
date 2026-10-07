import { createFileRoute } from "@tanstack/react-router";

import { createApp } from "../server/app.ts";

const app = createApp();

const handle = ({ request }: { request: Request }) => app.fetch(request);

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: { GET: handle, POST: handle, PUT: handle, PATCH: handle, DELETE: handle },
  },
});
