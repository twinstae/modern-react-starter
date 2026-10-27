import {
  BookNotFoundError,
  DrawerNotFoundError,
  type DrawerStore,
} from "../application/drawer-ports.ts";
import { parseDrawer, toDrawerDto, type Drawer } from "../domain/drawer.ts";

/** 서랍을 프로세스 메모리에 둔다. 넣고 꺼낼 때 복사해 바깥에서 바꿔도 남은 값이 그대로다. */
export function createMemoryDrawerStore(): DrawerStore {
  const drawers: Drawer[] = [];

  const find = (id: string): Drawer => {
    const drawer = drawers.find((entry) => entry.id === id);
    if (drawer === undefined) throw new DrawerNotFoundError(id);
    return drawer;
  };
  const replace = (next: Drawer): Drawer => {
    const parsed = parseDrawer(toDrawerDto(next));
    drawers.splice(
      drawers.findIndex(({ id }) => id === next.id),
      1,
      parsed,
    );
    return toDrawerDto(parsed);
  };
  const requireBook = (drawer: Drawer, bookId: string) => {
    if (!drawer.books.some(({ id }) => id === bookId)) throw new BookNotFoundError(bookId);
  };

  return {
    async list() {
      return drawers.map(toDrawerDto);
    },
    async create({ id, name }) {
      const drawer = parseDrawer({ id, name, questions: [], books: [] });
      drawers.push(drawer);
      return toDrawerDto(drawer);
    },
    async update(id, { name, questions }) {
      const drawer = find(id);
      return replace({
        ...drawer,
        name: name ?? drawer.name,
        questions: questions === undefined ? drawer.questions : [...questions],
      });
    },
    async remove(id) {
      find(id);
      drawers.splice(
        drawers.findIndex((entry) => entry.id === id),
        1,
      );
    },
    async addBooks(drawerId, books) {
      const drawer = find(drawerId);
      return replace({ ...drawer, books: [...drawer.books, ...books] });
    },
    async updateBook(drawerId, bookId, input) {
      const drawer = find(drawerId);
      requireBook(drawer, bookId);
      return replace({
        ...drawer,
        books: drawer.books.map((book) => (book.id === bookId ? { id: bookId, ...input } : book)),
      });
    },
    async removeBook(drawerId, bookId) {
      const drawer = find(drawerId);
      requireBook(drawer, bookId);
      return replace({ ...drawer, books: drawer.books.filter(({ id }) => id !== bookId) });
    },
  };
}
