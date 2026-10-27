import type { AdminShelf } from "../../admin-dto.ts";
import type { DrawerBoardDrawer } from "../../components/drawer-board.tsx";
import { shelfKinds } from "../../domain/shelf.ts";
import { MutedText, WarningText } from "../../ui/index.ts";

export const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : "잠시 뒤 다시 시도해 주세요";

export const drawerBoardDrawers = (shelf: AdminShelf): DrawerBoardDrawer[] => {
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

/** loader가 서버 상태를 읽는 동안 보여 줄 안내. 라우트마다 무엇을 읽는지만 다르다. */
export const pendingText = (text: string) =>
  function Pending() {
    return <MutedText role="status">{text}</MutedText>;
  };

/** loader가 실패했을 때의 안내. 다시 열면 loader가 다시 읽는다. */
export function LoadError({ error }: { error: unknown }) {
  return <WarningText role="alert">{messageOf(error)}</WarningText>;
}
