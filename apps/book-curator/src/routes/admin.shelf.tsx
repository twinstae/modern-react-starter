import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, createLink, Outlet, useNavigate } from "@tanstack/react-router";

import { BookList } from "../components/book-list.tsx";
import { adminQueries } from "../queries.ts";
import { ButtonAnchor, MutedText, Row, Section, SectionTitle } from "../ui/index.ts";
import { LoadError, pendingText } from "./-admin/view.tsx";

const ButtonLink = createLink(ButtonAnchor);

/** 서가의 책 목록. 책 추가·고치기는 이 페이지 위에 열리는 하위 페이지다. */
export const Route = createFileRoute("/admin/shelf")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQueries.shelf()),
  pendingComponent: pendingText("서가를 읽고 있어요."),
  errorComponent: LoadError,
  component: ShelfPage,
});

function ShelfPage() {
  const { data: shelf } = useSuspenseQuery(adminQueries.shelf());
  const navigate = useNavigate();

  return (
    <Section mt="6" gap="4" aria-labelledby="admin-shelf-title">
      <Row justifyContent="space-between" flexWrap="wrap" gap="3">
        <SectionTitle id="admin-shelf-title">서가</SectionTitle>
        <ButtonLink to="/admin/shelf/new">책 추가</ButtonLink>
      </Row>
      <MutedText>
        {shelf.books.length}권 · 관련도는 참고용이고, 서랍 표시는 질문 세트에서 옵니다.
      </MutedText>
      <BookList
        books={shelf.books}
        drawers={shelf.drawers}
        onEdit={(book) =>
          void navigate({ to: "/admin/shelf/$bookId", params: { bookId: book.id } })
        }
      />
      <Outlet />
    </Section>
  );
}
