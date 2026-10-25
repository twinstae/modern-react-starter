import { useState } from "react";
import { styled } from "styled-system/jsx";

import type { DrawerCode } from "../domain/question-set.ts";
import { MINIMUM_SHELF_KINDS } from "../domain/shelf.ts";

export interface DrawerBoardBook {
  readonly bookId: string;
  readonly title: string;
  readonly author: string;
  readonly quantity: number;
}

export interface DrawerBoardDrawer {
  readonly code: DrawerCode;
  readonly name: string;
  readonly mark: string | null;
  readonly kinds: number;
  readonly books: readonly DrawerBoardBook[];
}

const Board = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(19rem, 1fr))",
    gap: "4",
    alignItems: "start",
  },
});

const Card = styled("section", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "3",
    p: "4",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    boxShadow: "zine",
  },
});

const CardHeader = styled("div", {
  base: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "3",
    pb: "3",
    borderBottomWidth: "1px",
    borderColor: "paper.300",
  },
});

const DrawerName = styled("h3", {
  base: { fontFamily: "heading", fontSize: "kiosk-body", fontWeight: "600", wordBreak: "keep-all" },
});

const Mark = styled("span", {
  base: {
    display: "inline-block",
    mt: "1",
    color: "seal.500",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
  },
});

const Kinds = styled("p", {
  base: {
    flexShrink: "0",
    color: "fg.muted",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    whiteSpace: "nowrap",
  },
});

const Warning = styled("p", {
  base: {
    px: "2",
    py: "2",
    borderWidth: "1px",
    borderColor: "seal.500",
    borderRadius: "l2",
    bg: "surface",
    color: "seal.500",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
  },
});

const BookList = styled("ul", {
  base: { display: "flex", flexDirection: "column", gap: "2", m: "0", p: "0", listStyle: "none" },
});

const BookRow = styled("li", {
  base: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 5rem auto",
    alignItems: "center",
    gap: "2",
    pb: "2",
    borderBottomWidth: "1px",
    borderColor: "paper.200",
  },
});

const BookTitle = styled("span", {
  base: {
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    overflowWrap: "anywhere",
  },
});

const BookAuthor = styled("span", {
  base: { display: "block", color: "fg.muted", fontSize: "kiosk-caption", fontWeight: "400" },
});

const NumberInput = styled("input", {
  base: {
    width: "full",
    minH: "9",
    px: "2",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    textAlign: "center",
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "2px" },
  },
});

const RemoveButton = styled("button", {
  base: {
    minH: "9",
    px: "2",
    borderWidth: "1px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "surface",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    cursor: "pointer",
    _hover: { bg: "paper.100" },
    _focusVisible: { outline: "3px solid", outlineColor: "ink.900", outlineOffset: "2px" },
  },
});

const Empty = styled("p", {
  base: { color: "fg.muted", fontFamily: "body", fontSize: "kiosk-caption" },
});

const AddRow = styled("div", {
  base: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 4.5rem auto",
    gap: "2",
    pt: "2",
    borderTopWidth: "1px",
    borderColor: "paper.300",
  },
});

const Select = styled("select", {
  base: {
    width: "full",
    minH: "9",
    px: "2",
    borderWidth: "2px",
    borderColor: "border",
    borderRadius: "l2",
    bg: "paper.50",
    color: "fg.default",
    fontFamily: "body",
    fontSize: "kiosk-caption",
  },
});

const AddButton = styled("button", {
  base: {
    minH: "9",
    px: "3",
    borderWidth: "2px",
    borderColor: "pine.700",
    borderRadius: "l2",
    bg: "pine.600",
    color: "paper.50",
    fontFamily: "body",
    fontSize: "kiosk-caption",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap",
    _disabled: { cursor: "not-allowed", opacity: "0.5" },
  },
});

function QuantityInput({
  label,
  quantity,
  onCommit,
}: {
  label: string;
  quantity: number;
  onCommit: (quantity: number) => void;
}) {
  const [value, setValue] = useState(String(quantity));

  const commit = () => {
    const next = Number(value);
    if (!Number.isInteger(next) || next < 0) {
      setValue(String(quantity));
      return;
    }
    if (next !== quantity) onCommit(next);
  };

  return (
    <NumberInput
      aria-label={label}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        commit();
      }}
    />
  );
}

function DrawerCard({
  drawer,
  books,
  onAdd,
  onSetQuantity,
  onRemove,
}: {
  drawer: DrawerBoardDrawer;
  books: readonly { bookId: string; title: string }[];
  onAdd: (drawer: DrawerCode, bookId: string, quantity: number) => void;
  onSetQuantity: (drawer: DrawerCode, bookId: string, quantity: number) => void;
  onRemove: (drawer: DrawerCode, bookId: string) => void;
}) {
  const [selected, setSelected] = useState("");
  const [addQuantity, setAddQuantity] = useState("1");
  const addNumber = Number(addQuantity);
  const canAdd = selected !== "" && Number.isInteger(addNumber) && addNumber >= 0;

  const add = () => {
    if (!canAdd) return;
    onAdd(drawer.code, selected, addNumber);
    setSelected("");
    setAddQuantity("1");
  };

  return (
    <Card aria-labelledby={`drawer-${drawer.code}`}>
      <CardHeader>
        <div>
          <DrawerName id={`drawer-${drawer.code}`}>{drawer.name}</DrawerName>
          {drawer.mark === null ? null : <Mark>{drawer.mark}</Mark>}
        </div>
        <Kinds>{drawer.kinds}종</Kinds>
      </CardHeader>

      {drawer.kinds < MINIMUM_SHELF_KINDS ? (
        <Warning role="status" aria-label={`${drawer.name} 3종 미만 경고`}>
          {drawer.name}은 {MINIMUM_SHELF_KINDS}종 미만이라 이 서랍은 아직 열 수 없어요. 지금{" "}
          {drawer.kinds}종이에요.
        </Warning>
      ) : null}

      {drawer.books.length === 0 ? (
        <Empty>아직 책이 없어요.</Empty>
      ) : (
        <BookList>
          {drawer.books.map((book) => (
            <BookRow key={book.bookId}>
              <span>
                <BookTitle>{book.title}</BookTitle>
                <BookAuthor>{book.author}</BookAuthor>
              </span>
              <QuantityInput
                key={`${book.bookId}:${book.quantity}`}
                label={`${drawer.name} ${book.title} 수량`}
                quantity={book.quantity}
                onCommit={(quantity) => onSetQuantity(drawer.code, book.bookId, quantity)}
              />
              <RemoveButton
                type="button"
                aria-label={`${drawer.name} ${book.title} 빼기`}
                onClick={() => onRemove(drawer.code, book.bookId)}
              >
                빼기
              </RemoveButton>
            </BookRow>
          ))}
        </BookList>
      )}

      <AddRow>
        <Select
          aria-label={`${drawer.name}에 책 추가`}
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value="">책 고르기</option>
          {books.map((book) => (
            <option key={book.bookId} value={book.bookId}>
              {book.title}
            </option>
          ))}
        </Select>
        <NumberInput
          aria-label={`${drawer.name} 새 책 수량`}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={addQuantity}
          onChange={(event) => setAddQuantity(event.target.value)}
        />
        <AddButton type="button" onClick={add} disabled={!canAdd}>
          넣기
        </AddButton>
      </AddRow>
    </Card>
  );
}

/**
 * 서랍 일곱 칸. 서랍마다 표시·책·수량을 보여 주고, 수량 0인 책도 남긴다(R-9).
 * 3종 미만이면 경고를 보여 주되 입력을 막지는 않는다(I-7).
 */
export function DrawerBoard({
  drawers,
  books,
  onAdd,
  onSetQuantity,
  onRemove,
}: {
  drawers: readonly DrawerBoardDrawer[];
  books: readonly { bookId: string; title: string }[];
  onAdd: (drawer: DrawerCode, bookId: string, quantity: number) => void;
  onSetQuantity: (drawer: DrawerCode, bookId: string, quantity: number) => void;
  onRemove: (drawer: DrawerCode, bookId: string) => void;
}) {
  return (
    <Board>
      {drawers.map((drawer) => (
        <DrawerCard
          key={drawer.code}
          drawer={drawer}
          books={books}
          onAdd={onAdd}
          onSetQuantity={onSetQuantity}
          onRemove={onRemove}
        />
      ))}
    </Board>
  );
}
