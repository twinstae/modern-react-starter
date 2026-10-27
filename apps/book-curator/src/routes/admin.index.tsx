import { createFileRoute, redirect } from "@tanstack/react-router";

/** 운영자 화면의 첫 페이지는 서랍이다. */
export const Route = createFileRoute("/admin/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/drawers" });
  },
});
