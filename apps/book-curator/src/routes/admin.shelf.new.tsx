import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { adminQueries } from "../queries.ts";
import { BookEditor } from "./-admin/book-editor.tsx";

export const Route = createFileRoute("/admin/shelf/new")({
  component: NewBookPage,
});

function NewBookPage() {
  const { data: shelf } = useSuspenseQuery(adminQueries.shelf());
  return <BookEditor shelf={shelf} book={null} />;
}
