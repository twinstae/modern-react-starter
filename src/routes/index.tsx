import { createFileRoute } from "@tanstack/react-router";

import { styled } from "styled-system/jsx";

export const Route = createFileRoute("/")({ component: App });

const CenterMain = styled("main", {
  base: {
    minHeight: "screen",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    px: "4",
  },
});

function App() {
  return <CenterMain></CenterMain>;
}
