import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { removeDrawerBook, setDrawerQuantity } from "../admin-api.ts";
import { DrawerBoard } from "../components/drawer-board.tsx";
import type { DrawerCode } from "../domain/question-set.ts";
import { adminQueries } from "../queries.ts";
import { MutedText, Row, Section, SectionTitle, WarningText } from "../ui/index.ts";
import { drawerBoardDrawers, LoadError, messageOf, pendingText } from "./-admin/view.tsx";

/** 서랍마다 어떤 책이 몇 권 있는지 고친다. 고친 뒤 서가 query를 무효화해 서가 페이지와 같은 값을 본다. */
export const Route = createFileRoute("/admin/drawers")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQueries.shelf()),
  pendingComponent: pendingText("서랍을 읽고 있어요."),
  errorComponent: LoadError,
  component: DrawersPage,
});

function DrawersPage() {
  const { data: shelf } = useSuspenseQuery(adminQueries.shelf());
  const queryClient = useQueryClient();
  const refreshShelf = () =>
    queryClient.invalidateQueries({ queryKey: adminQueries.shelf().queryKey });

  const putQuantity = useMutation({
    mutationFn: ({
      drawer,
      bookId,
      quantity,
    }: {
      drawer: DrawerCode;
      bookId: string;
      quantity: number;
    }) => setDrawerQuantity(drawer, bookId, quantity),
    onSuccess: refreshShelf,
  });

  const removeBook = useMutation({
    mutationFn: ({ drawer, bookId }: { drawer: DrawerCode; bookId: string }) =>
      removeDrawerBook(drawer, bookId),
    onSuccess: refreshShelf,
  });

  const drawerError = putQuantity.error ?? removeBook.error;

  return (
    <Section mt="6" gap="4" aria-labelledby="admin-drawers-title">
      <Row justifyContent="space-between" flexWrap="wrap" gap="3">
        <SectionTitle id="admin-drawers-title">서랍</SectionTitle>
        <MutedText>수량 0은 “없음”이고, 책을 빼면 목록에서 사라져요.</MutedText>
      </Row>
      {drawerError === null ? null : (
        <WarningText role="alert">{messageOf(drawerError)}</WarningText>
      )}
      <DrawerBoard
        drawers={drawerBoardDrawers(shelf)}
        books={shelf.books.map(({ id, title }) => ({ bookId: id, title }))}
        onAdd={(drawer, bookId, quantity) => putQuantity.mutate({ drawer, bookId, quantity })}
        onSetQuantity={(drawer, bookId, quantity) =>
          putQuantity.mutate({ drawer, bookId, quantity })
        }
        onRemove={(drawer, bookId) => removeBook.mutate({ drawer, bookId })}
      />
    </Section>
  );
}
