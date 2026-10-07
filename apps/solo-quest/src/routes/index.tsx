import { createFileRoute } from "@tanstack/react-router";
import { styled } from "styled-system/jsx";

export const Route = createFileRoute("/")({ component: Home });

const Main = styled("main", {
  base: { minHeight: "screen", display: "flex", justifyContent: "center", alignItems: "center" },
});

function Home() {
  return <Main>SOLO QUEST</Main>;
}
