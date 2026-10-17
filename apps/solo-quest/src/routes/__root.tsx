import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { PageRoot, trpgRedDocument } from "@repo/ui";

import appCss from "../styles.css?url";

interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SOLO QUEST" },
    ],
    links: [
      ...trpgRedDocument.stylesheets.map((href) => ({ rel: "stylesheet", href })),
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" {...trpgRedDocument.attributes}>
      <head>
        <HeadContent />
      </head>
      <body>
        <PageRoot>{children}</PageRoot>
        <Scripts />
      </body>
    </html>
  );
}
