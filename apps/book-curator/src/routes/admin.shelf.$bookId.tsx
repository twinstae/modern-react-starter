import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";

import { adminQueries } from "../queries.ts";
import { MutedText } from "../ui/index.ts";
import { BookEditor } from "./-admin/book-editor.tsx";

/** 책 고치기. 서가에 없는 id면 찾지 못했다고 알린다. */
export const Route = createFileRoute("/admin/shelf/$bookId")({
  notFoundComponent: () => <MutedText role="status">서가에서 이 책을 찾지 못했어요.</MutedText>,
  component: EditBookPage,
});

function EditBookPage() {
  const { bookId } = Route.useParams();
  const { data: shelf } = useSuspenseQuery(adminQueries.shelf());
  const book = shelf.books.find(({ id }) => id === bookId);
  if (book === undefined) throw notFound();
  return <BookEditor shelf={shelf} book={book} />;
}
