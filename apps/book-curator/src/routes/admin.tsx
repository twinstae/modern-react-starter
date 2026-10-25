import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { styled } from "styled-system/jsx";

import {
  clonePublishedQuestionSetDraft,
  createAdminBook,
  createQuestionSetDraft,
  publishQuestionSetDraft,
  removeDrawerBook,
  saveOwnerPin,
  saveQuestionSetDraft,
  setDrawerQuantity,
  signInAdmin,
  signOutAdmin,
  updateAdminBook,
} from "../admin-api.ts";
import type { AdminShelf } from "../admin-dto.ts";
import { AdminLogin } from "../components/admin-login.tsx";
import { BookDialog, BookForm } from "../components/book-form.tsx";
import { BookList } from "../components/book-list.tsx";
import { DrawerBoard, type DrawerBoardDrawer } from "../components/drawer-board.tsx";
import { PinEntry } from "../components/pin-entry.tsx";
import { QuestionSetDraftBar } from "../components/question-set-draft-bar.tsx";
import { QuestionSetEditor } from "../components/question-set-editor.tsx";
import { SetReportPanel } from "../components/set-report-panel.tsx";
import type { Book, BookInput } from "../domain/book.ts";
import type { DrawerCode, QuestionSet } from "../domain/question-set.ts";
import { shelfKinds } from "../domain/shelf.ts";
import { adminQueries, kioskQueries } from "../queries.ts";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const Screen = styled("main", {
  base: {
    minH: "100dvh",
    px: "page",
    py: "8",
    bg: "canvas",
    color: "fg.default",
  },
});

const Centered = styled("div", {
  base: {
    minH: "calc(100dvh - 4rem)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

const LoginCard = styled("section", {
  base: {
    width: "full",
    maxW: "30rem",
    p: "6",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    boxShadow: "zineLg",
    md: { p: "8" },
  },
});

const Eyebrow = styled("p", {
  base: {
    color: "pine.700",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    letterSpacing: "0.12em",
  },
});

const Title = styled("h1", {
  base: {
    mt: "2",
    fontFamily: "heading",
    fontSize: "2xl",
    fontWeight: "600",
    wordBreak: "keep-all",
  },
});

const Note = styled("p", {
  base: { mt: "3", color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const QuietButton = styled("button", {
  base: {
    minH: "10",
    px: "4",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    cursor: "pointer",
    _hover: { bg: "paper.100" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "2px" },
  },
});

const Workspace = styled("div", {
  base: { width: "full", maxW: "80rem", mx: "auto" },
});

const Header = styled("header", {
  base: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "4",
    pb: "4",
    borderBottomWidth: "2px",
    borderColor: "border",
  },
});

const Email = styled("p", {
  base: {
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    overflowWrap: "anywhere",
  },
});

const LoginBar = styled("div", {
  base: { display: "flex", alignItems: "center", gap: "3" },
});

const TabList = styled("div", {
  base: {
    display: "flex",
    gap: "2",
    mt: "5",
    pb: "2",
    borderBottomWidth: "2px",
    borderColor: "border",
  },
});

const Tab = styled("button", {
  base: {
    minH: "11",
    px: "4",
    borderWidth: "2px",
    borderColor: "transparent",
    borderRadius: "l2",
    bg: "transparent",
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "kiosk-body",
    fontWeight: "700",
    cursor: "pointer",
    _hover: { bg: "paper.100" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "2px" },
    '&[aria-selected="true"]': {
      borderColor: "border",
      bg: "yellow.100",
      color: "fg.default",
      boxShadow: "zine",
    },
  },
});

const Panel = styled("section", {
  base: { display: "flex", flexDirection: "column", gap: "4", mt: "6" },
});

const PanelHeader = styled("div", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "3",
    flexWrap: "wrap",
  },
});

const SectionTitle = styled("h2", {
  base: { fontFamily: "heading", fontSize: "xl", fontWeight: "600" },
});

const PrimaryButton = styled("button", {
  base: {
    minH: "11",
    px: "4",
    borderWidth: "2px",
    borderColor: "pine.700",
    borderRadius: "l2",
    bg: "pine.600",
    color: "paper.50",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "zine",
    _hover: { bg: "pine.700" },
    _active: { translate: "2px 2px", boxShadow: "none" },
    _disabled: { cursor: "not-allowed", opacity: "0.6" },
  },
});

const Status = styled("p", {
  base: { color: "pine.700", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "600" },
});

const Failure = styled("p", {
  base: { color: "seal.500", fontFamily: "body", fontSize: "kiosk-caption", fontWeight: "700" },
});

const PinPanel = styled("section", {
  base: { display: "flex", flexDirection: "column", gap: "3", maxW: "28rem" },
});

type TabName = "shelf" | "drawers" | "questions" | "pin";

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : "잠시 뒤 다시 시도해 주세요";

const drawerBoardDrawers = (shelf: AdminShelf): DrawerBoardDrawer[] => {
  const booksById = new Map(shelf.books.map((book) => [book.id, book]));

  return shelf.drawers.map((drawer) => {
    const entries = shelf.stock.filter((entry) => entry.drawer === drawer.code);
    return {
      code: drawer.code,
      name: drawer.name,
      mark: drawer.mark,
      kinds: shelfKinds(shelf.stock, drawer.code),
      books: entries.map((entry) => {
        const book = booksById.get(entry.bookId);
        return {
          bookId: entry.bookId,
          title: book?.title ?? "서가에 없는 책",
          author: book?.author ?? "",
          quantity: entry.quantity,
        };
      }),
    };
  });
};

/**
 * 운영자 화면. 로그인 뒤 서가·서랍·주인 PIN을 탭으로 나눈다.
 * 서버 상태는 `adminQueries.shelf()` 하나로 읽고, 고친 뒤에는 그 query를 무효화한다.
 */
function AdminPage() {
  const queryClient = useQueryClient();
  const me = useQuery({
    ...adminQueries.me(),
    // 서버 렌더링에는 브라우저 쿠키가 없다. 브라우저에서 붙은 뒤에 세션을 읽는다.
    enabled: typeof window !== "undefined",
  });
  const [pinSaved, setPinSaved] = useState(false);
  const [tab, setTab] = useState<TabName>("shelf");
  const [editing, setEditing] = useState<Book | "new" | null>(null);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [publishMessage, setPublishMessage] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const shelf = useQuery({
    ...adminQueries.shelf(),
    enabled: me.data !== null && me.data !== undefined,
  });

  const drafts = useQuery({
    ...adminQueries.questionSetDrafts(),
    enabled: me.data !== null && me.data !== undefined,
  });

  const versions = useQuery({
    ...adminQueries.publishedVersions(),
    enabled: me.data !== null && me.data !== undefined,
  });

  const draft = useQuery({
    ...adminQueries.questionSetDraft(selectedDraftId ?? ""),
    enabled: selectedDraftId !== null,
  });

  const report = useQuery({
    ...adminQueries.questionSetReport(selectedDraftId ?? ""),
    enabled: selectedDraftId !== null,
  });

  useEffect(() => {
    if (drafts.data === undefined) return;
    if (selectedDraftId === null) {
      const first = drafts.data[0];
      if (first !== undefined) setSelectedDraftId(first.id);
      return;
    }
    if (!drafts.data.some(({ id }) => id === selectedDraftId)) {
      setSelectedDraftId(drafts.data[0]?.id ?? null);
    }
  }, [drafts.data, selectedDraftId]);

  const refreshShelf = async () => {
    await queryClient.invalidateQueries({ queryKey: adminQueries.shelf().queryKey });
  };

  const saveBook = useMutation({
    mutationFn: ({ bookId, input }: { bookId: string | null; input: BookInput }) =>
      bookId === null ? createAdminBook(input) : updateAdminBook(bookId, input),
    onSuccess: async () => {
      await refreshShelf();
      setEditing(null);
    },
  });

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

  const refreshDraftList = async () => {
    await queryClient.invalidateQueries({
      queryKey: adminQueries.questionSetDrafts().queryKey,
    });
  };

  const selectDraft = (id: string | null) => {
    setSelectedDraftId(id);
    setPublishMessage(null);
    setPublishError(null);
    setDraftError(null);
  };

  const createDraft = useMutation({
    mutationFn: (name: string) => createQuestionSetDraft(name),
    onSuccess: async (created) => {
      setDraftMessage(`“${created.name}” 초안을 만들었어요.`);
      setDraftError(null);
      setPublishMessage(null);
      setPublishError(null);
      setSelectedDraftId(created.id);
      await refreshDraftList();
    },
    onError: (error) => {
      setDraftMessage(null);
      setDraftError(messageOf(error));
    },
  });

  const cloneDraft = useMutation({
    mutationFn: clonePublishedQuestionSetDraft,
    onSuccess: async (created) => {
      setDraftMessage(`“${created.name}” 초안을 만들었어요.`);
      setDraftError(null);
      setPublishMessage(null);
      setPublishError(null);
      setSelectedDraftId(created.id);
      await refreshDraftList();
    },
    onError: (error) => {
      setDraftMessage(null);
      setDraftError(messageOf(error));
    },
  });

  const saveDraft = useMutation({
    mutationFn: ({
      id,
      name,
      questionSet,
    }: {
      id: string;
      name: string;
      questionSet: QuestionSet;
    }) => saveQuestionSetDraft(id, name, questionSet),
    onSuccess: async (saved) => {
      setDraftError(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminQueries.questionSetDraft(saved.id).queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: adminQueries.questionSetReport(saved.id).queryKey,
        }),
        refreshDraftList(),
      ]);
    },
  });

  const publishDraft = useMutation({
    mutationFn: (id: string) => publishQuestionSetDraft(id),
    onSuccess: async (published) => {
      setPublishError(null);
      setPublishMessage(`공개 버전 ${published.version}을 만들었어요.`);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminQueries.publishedVersions().queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: adminQueries.questionSetReport(selectedDraftId ?? "").queryKey,
        }),
        queryClient.invalidateQueries({
          queryKey: adminQueries.questionSetDraft(selectedDraftId ?? "").queryKey,
        }),
        queryClient.invalidateQueries({ queryKey: adminQueries.shelf().queryKey }),
        queryClient.invalidateQueries({ queryKey: kioskQueries.current().queryKey }),
        refreshDraftList(),
      ]);
    },
    onError: (error) => {
      setPublishMessage(null);
      setPublishError(messageOf(error));
    },
  });

  const reloadSession = () => queryClient.invalidateQueries({ queryKey: ["admin", "me"] });

  if (me.isPending) {
    return (
      <Screen>
        <Centered>
          <Note role="status">운영자 세션을 확인하고 있어요.</Note>
        </Centered>
      </Screen>
    );
  }

  if (me.isError) {
    return (
      <Screen>
        <Centered>
          <LoginCard>
            <Title>운영자 세션을 읽지 못했어요</Title>
            <Note>잠시 뒤 다시 열어 주세요.</Note>
            <QuietButton type="button" onClick={() => void me.refetch()}>
              다시 시도
            </QuietButton>
          </LoginCard>
        </Centered>
      </Screen>
    );
  }

  if (me.data === null) {
    return <AdminLogin onSubmit={signInAdmin} onSuccess={() => void reloadSession()} />;
  }

  const shelfData = shelf.data;
  const drawerError = putQuantity.error ?? removeBook.error;

  return (
    <Screen>
      <Workspace>
        <Header>
          <div>
            <Eyebrow>BOOK SHOP 79-1</Eyebrow>
            <Title>운영자 화면</Title>
            <Email>{me.data.user.email}</Email>
          </div>
          <LoginBar>
            <QuietButton
              type="button"
              onClick={async () => {
                await signOutAdmin();
                await reloadSession();
              }}
            >
              로그아웃
            </QuietButton>
          </LoginBar>
        </Header>

        <TabList role="tablist" aria-label="운영자 화면">
          {(
            [
              ["shelf", "서가"],
              ["drawers", "서랍"],
              ["questions", "질문 세트"],
              ["pin", "주인 PIN"],
            ] as const
          ).map(([name, label]) => (
            <Tab
              key={name}
              type="button"
              role="tab"
              id={`admin-tab-${name}`}
              aria-controls={`admin-panel-${name}`}
              aria-selected={tab === name}
              onClick={() => setTab(name)}
            >
              {label}
            </Tab>
          ))}
        </TabList>

        {tab === "shelf" ? (
          <Panel role="tabpanel" id="admin-panel-shelf" aria-labelledby="admin-tab-shelf">
            <PanelHeader>
              <SectionTitle>서가</SectionTitle>
              <PrimaryButton
                type="button"
                onClick={() => setEditing("new")}
                disabled={shelfData === undefined}
              >
                책 추가
              </PrimaryButton>
            </PanelHeader>

            {shelf.isPending ? <Note role="status">서가를 읽고 있어요.</Note> : null}
            {shelf.isError ? <Failure role="alert">{messageOf(shelf.error)}</Failure> : null}
            {shelfData === undefined ? null : (
              <>
                <Note>
                  {shelfData.books.length}권 · 관련도는 참고용이고, 서랍 표시는 질문 세트에서
                  옵니다.
                </Note>
                <BookList
                  books={shelfData.books}
                  drawers={shelfData.drawers}
                  onEdit={(book) => setEditing(book)}
                />
              </>
            )}
          </Panel>
        ) : null}

        {tab === "drawers" ? (
          <Panel role="tabpanel" id="admin-panel-drawers" aria-labelledby="admin-tab-drawers">
            <PanelHeader>
              <SectionTitle>서랍</SectionTitle>
              <Note>수량 0은 “없음”이고, 책을 빼면 목록에서 사라져요.</Note>
            </PanelHeader>

            {shelf.isPending ? <Note role="status">서랍을 읽고 있어요.</Note> : null}
            {shelf.isError ? <Failure role="alert">{messageOf(shelf.error)}</Failure> : null}
            {drawerError === null ? null : <Failure role="alert">{messageOf(drawerError)}</Failure>}
            {shelfData === undefined ? null : (
              <DrawerBoard
                drawers={drawerBoardDrawers(shelfData)}
                books={shelfData.books.map(({ id, title }) => ({ bookId: id, title }))}
                onAdd={(drawer, bookId, quantity) =>
                  putQuantity.mutate({ drawer, bookId, quantity })
                }
                onSetQuantity={(drawer, bookId, quantity) =>
                  putQuantity.mutate({ drawer, bookId, quantity })
                }
                onRemove={(drawer, bookId) => removeBook.mutate({ drawer, bookId })}
              />
            )}
          </Panel>
        ) : null}

        {tab === "questions" ? (
          <Panel role="tabpanel" id="admin-panel-questions" aria-labelledby="admin-tab-questions">
            <PanelHeader>
              <SectionTitle>질문 세트</SectionTitle>
              <Note>
                문장을 쓰는 자리예요. 저장은 초안에만 하고, 점검을 통과해야 새 버전으로 공개할 수
                있어요.
              </Note>
            </PanelHeader>

            {drafts.isError ? <Failure role="alert">{messageOf(drafts.error)}</Failure> : null}
            <QuestionSetDraftBar
              drafts={drafts.data ?? []}
              selectedId={selectedDraftId}
              onSelect={selectDraft}
              onCreate={(name) => createDraft.mutate(name)}
              onClone={() => cloneDraft.mutate()}
              busy={createDraft.isPending || cloneDraft.isPending}
              message={draftMessage}
              error={draftError}
            />

            {selectedDraftId === null ? (
              <Note>초안을 고르거나, 공개 버전을 복제해 새 초안을 만드세요.</Note>
            ) : null}
            {selectedDraftId !== null && draft.isPending ? (
              <Note role="status">초안을 읽고 있어요.</Note>
            ) : null}
            {selectedDraftId !== null && draft.isError ? (
              <Failure role="alert">{messageOf(draft.error)}</Failure>
            ) : null}
            {draft.data === undefined ? null : (
              <QuestionSetEditor
                key={`${draft.data.id}:${draft.data.updatedAt}`}
                draft={draft.data}
                onSave={async ({ name, questionSet }) => {
                  try {
                    await saveDraft.mutateAsync({
                      id: draft.data.id,
                      name,
                      questionSet,
                    });
                    return undefined;
                  } catch (error) {
                    return messageOf(error);
                  }
                }}
              />
            )}

            {selectedDraftId !== null && report.isPending ? (
              <Note role="status">점검을 돌리고 있어요.</Note>
            ) : null}
            {selectedDraftId !== null && report.isError ? (
              <Failure role="alert">{messageOf(report.error)}</Failure>
            ) : null}
            {report.data === undefined || draft.data === undefined ? null : (
              <SetReportPanel
                report={report.data}
                drawers={draft.data.questionSet.drawers.map(({ code, name }) => ({ code, name }))}
                onPublish={() => {
                  if (selectedDraftId !== null) publishDraft.mutate(selectedDraftId);
                }}
                publishing={publishDraft.isPending}
                publishMessage={publishMessage}
                publishError={publishError}
              />
            )}

            {versions.data === undefined ? null : (
              <Note>
                공개 버전:{" "}
                {versions.data.length === 0
                  ? "아직 없음"
                  : versions.data
                      .map(({ version, questionCount }) => `${version}번(${questionCount}문항)`)
                      .join(" · ")}
              </Note>
            )}
          </Panel>
        ) : null}

        {tab === "pin" ? (
          <Panel role="tabpanel" id="admin-panel-pin" aria-labelledby="admin-tab-pin">
            <SectionTitle>주인 PIN</SectionTitle>
            <PinPanel>
              <Note>태블릿에서 주인 확인을 열 때 쓰는 PIN이에요. 정하거나 바꿀 수 있어요.</Note>
              <PinEntry
                title="주인 PIN"
                submitLabel="PIN 저장"
                onSubmit={async (pin) => {
                  setPinSaved(false);
                  const failure = await saveOwnerPin(pin);
                  if (failure === undefined) setPinSaved(true);
                  return failure;
                }}
              />
              {pinSaved ? <Status role="status">PIN을 저장했어요.</Status> : null}
            </PinPanel>
          </Panel>
        ) : null}

        {editing === null || shelfData === undefined ? null : (
          <BookDialog
            title={editing === "new" ? "새 책 추가" : "책 고치기"}
            onClose={() => setEditing(null)}
          >
            <BookForm
              drawers={shelfData.drawers}
              initial={editing === "new" ? undefined : editing}
              submitLabel={editing === "new" ? "책 저장" : "고친 내용 저장"}
              onSubmit={async (input) => {
                try {
                  await saveBook.mutateAsync({
                    bookId: editing === "new" ? null : editing.id,
                    input,
                  });
                  return undefined;
                } catch (error) {
                  return messageOf(error);
                }
              }}
              onCancel={() => setEditing(null)}
            />
          </BookDialog>
        )}
      </Workspace>
    </Screen>
  );
}
