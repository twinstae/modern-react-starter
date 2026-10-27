import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { createAdminBook, updateAdminBook } from "../../admin-api.ts";
import type { AdminShelf } from "../../admin-dto.ts";
import { BookDialog, BookForm } from "../../components/book-form.tsx";
import type { Book, BookInput } from "../../domain/book.ts";
import { adminQueries } from "../../queries.ts";
import { messageOf } from "./view.tsx";

/** 새 책과 책 고치기 페이지가 함께 쓰는 대화상자. 저장하거나 닫으면 서가로 돌아간다. */
export function BookEditor({ shelf, book }: { shelf: AdminShelf; book: Book | null }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const close = () => navigate({ to: "/admin/shelf" });

  const save = useMutation({
    mutationFn: (input: BookInput) =>
      book === null ? createAdminBook(input) : updateAdminBook(book.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminQueries.shelf().queryKey });
      await close();
    },
  });

  return (
    <BookDialog title={book === null ? "새 책 추가" : "책 고치기"} onClose={() => void close()}>
      <BookForm
        drawers={shelf.drawers}
        initial={book ?? undefined}
        submitLabel={book === null ? "책 저장" : "고친 내용 저장"}
        onSubmit={async (input) => {
          try {
            await save.mutateAsync(input);
            return undefined;
          } catch (error) {
            return messageOf(error);
          }
        }}
        onCancel={() => void close()}
      />
    </BookDialog>
  );
}
