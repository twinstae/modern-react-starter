import { createFileRoute, redirect } from "@tanstack/react-router";

import { adminQueries } from "../queries.ts";
import { MutedText } from "../ui/index.ts";

/** 초안을 고르지 않고 오면 첫 초안을 연다. 초안이 없으면 만드는 방법을 알린다. */
export const Route = createFileRoute("/admin/questions/")({
  beforeLoad: async ({ context }) => {
    const [first] = await context.queryClient.ensureQueryData(adminQueries.questionSetDrafts());
    if (first !== undefined) {
      throw redirect({
        to: "/admin/questions/$draftId",
        params: { draftId: first.id },
        replace: true,
      });
    }
  },
  component: () => <MutedText>초안을 고르거나, 공개 버전을 복제해 새 초안을 만드세요.</MutedText>,
});
