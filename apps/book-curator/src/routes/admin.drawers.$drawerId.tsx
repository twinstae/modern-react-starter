import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import * as v from "valibot";

import { addBooks, deleteDrawer, removeBook, updateBook, updateDrawer } from "../admin-api.ts";
import { BookCsvUpload } from "../components/book-csv-upload.tsx";
import { DeleteDrawerButton } from "../components/delete-drawer-button.tsx";
import { DrawerBooksTable } from "../components/drawer-books-table.tsx";
import { DrawerQuestionsEditor } from "../components/drawer-questions-editor.tsx";
import { DrawerSchema } from "../domain/drawer.ts";
import { adminQueries } from "../queries.ts";
import {
  MutedText,
  Row,
  Section,
  SaveActions,
  SectionTitle,
  SimpleForm,
  TextField,
  WarningText,
} from "../ui/index.ts";
import { LoadError, messageOf, pendingText } from "./-admin/view.tsx";

const NameSchema = v.object({ name: DrawerSchema.entries.name });

/** 왼쪽에서 고른 서랍 하나. 이름·문항·책을 이 페이지에서 바로 고친다. */
export const Route = createFileRoute("/admin/drawers/$drawerId")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQueries.drawers()),
  pendingComponent: pendingText("서랍을 읽고 있어요."),
  errorComponent: LoadError,
  notFoundComponent: () => (
    <MutedText role="status">없는 서랍이에요. 왼쪽에서 서랍을 골라 주세요.</MutedText>
  ),
  component: DrawerPage,
});

function DrawerPage() {
  const { drawerId } = Route.useParams();
  const { data: drawers } = useSuspenseQuery(adminQueries.drawers());
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const drawer = drawers.find(({ id }) => id === drawerId);

  /** 서랍을 고치면 목록과 공개 점검이 함께 바뀐다. */
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: adminQueries.drawers().queryKey }),
      queryClient.invalidateQueries({ queryKey: adminQueries.publishCheck().queryKey }),
    ]);
  /** 폼 콜백 모양: 성공하면 undefined, 실패하면 화면에 보일 문구. */
  const attempt = async (run: () => Promise<unknown>): Promise<string | undefined> => {
    try {
      await run();
      await refresh();
      return undefined;
    } catch (error) {
      return messageOf(error);
    }
  };

  const remove = useMutation({
    mutationFn: (bookId: string) => removeBook(drawerId, bookId),
    onSuccess: refresh,
  });
  const removeDrawer = useMutation({
    mutationFn: () => deleteDrawer(drawerId),
    onSuccess: async () => {
      await refresh();
      await navigate({ to: "/admin/drawers" });
    },
  });

  if (drawer === undefined) throw notFound();

  return (
    <Section gap="5" aria-labelledby="drawer-title">
      <SectionTitle id="drawer-title">{drawer.name}</SectionTitle>

      <SimpleForm
        key={drawer.id}
        aria-label="서랍 이름"
        schema={NameSchema}
        defaultValues={{ name: drawer.name }}
        onSubmit={({ name }: { name: string }) => attempt(() => updateDrawer(drawerId, { name }))}
      >
        <Row alignItems="flex-end" flexWrap="wrap">
          <TextField name="name" label="서랍 이름" />
          <SaveActions submitLabel="이름 저장" />
        </Row>
      </SimpleForm>

      <DrawerQuestionsEditor
        key={drawer.id}
        questions={drawer.questions}
        onSave={(questions) => attempt(() => updateDrawer(drawerId, { questions }))}
      />

      <Section gap="3" aria-labelledby="drawer-books-title">
        <SectionTitle id="drawer-books-title">서랍 속 책 {drawer.books.length}권</SectionTitle>
        {remove.isError ? <WarningText role="alert">{messageOf(remove.error)}</WarningText> : null}
        <DrawerBooksTable
          books={drawer.books}
          onAdd={(book) => attempt(() => addBooks(drawerId, [book]))}
          onUpdate={(bookId, book) => attempt(() => updateBook(drawerId, bookId, book))}
          onRemove={(bookId) => remove.mutate(bookId)}
        />
        <BookCsvUpload onUpload={(books) => attempt(() => addBooks(drawerId, books))} />
      </Section>

      {removeDrawer.isError ? (
        <WarningText role="alert">{messageOf(removeDrawer.error)}</WarningText>
      ) : null}
      <DeleteDrawerButton
        drawerName={drawer.name}
        bookCount={drawer.books.length}
        deleting={removeDrawer.isPending}
        onDelete={() => removeDrawer.mutate()}
      />
    </Section>
  );
}
