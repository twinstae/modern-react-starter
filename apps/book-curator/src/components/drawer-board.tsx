import { useState } from "react";

import type { DrawerCode } from "../domain/question-set.ts";
import { MINIMUM_SHELF_KINDS } from "../domain/shelf.ts";
import {
  AutoGrid,
  Button,
  Card,
  CardHeader,
  InlineText,
  Input,
  List,
  ListItem,
  MutedText,
  Row,
  Select,
  SubTitle,
  WarningBox,
} from "../ui/index.ts";

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
    <Input
      size="sm"
      aria-label={label}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      textAlign="center"
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
    <Card tone="paper" aria-labelledby={`drawer-${drawer.code}`}>
      <CardHeader divider pb="3" alignItems="flex-start">
        <div>
          <SubTitle id={`drawer-${drawer.code}`}>{drawer.name}</SubTitle>
          {drawer.mark === null ? null : (
            <InlineText tone="seal" weight="strong" display="block" mt="1">
              {drawer.mark}
            </InlineText>
          )}
        </div>
        <InlineText tone="muted" flexShrink="0" whiteSpace="nowrap">
          {drawer.kinds}종
        </InlineText>
      </CardHeader>

      {drawer.kinds < MINIMUM_SHELF_KINDS ? (
        <WarningBox role="status" aria-label={`${drawer.name} 3종 미만 경고`}>
          3종 미만 · {drawer.kinds}종. {MINIMUM_SHELF_KINDS - drawer.kinds}종 더 채우면 열 수
          있어요.
        </WarningBox>
      ) : null}

      {drawer.books.length === 0 ? (
        <MutedText>아직 책이 없어요.</MutedText>
      ) : (
        <List gap="2">
          {drawer.books.map((book) => (
            <ListItem
              key={book.bookId}
              display="grid"
              gridTemplateColumns="minmax(0, 1fr) 5rem auto"
              gap="2"
              bordered
            >
              <span>
                <InlineText weight="strong" display="block" overflowWrap="anywhere">
                  {book.title}
                </InlineText>
                <InlineText tone="muted" display="block">
                  {book.author}
                </InlineText>
              </span>
              <QuantityInput
                key={`${book.bookId}:${book.quantity}`}
                label={`${drawer.name} ${book.title} 수량`}
                quantity={book.quantity}
                onCommit={(quantity) => onSetQuantity(drawer.code, book.bookId, quantity)}
              />
              <Button
                tone="outline"
                size="sm"
                aria-label={`${drawer.name} ${book.title} 빼기`}
                onClick={() => onRemove(drawer.code, book.bookId)}
              >
                빼기
              </Button>
            </ListItem>
          ))}
        </List>
      )}

      <Row gap="2" pt="2" borderTopWidth="1px" borderColor="paper.300">
        <Select
          flex="1"
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
        <Input
          size="sm"
          width="4.5rem"
          aria-label={`${drawer.name} 새 책 수량`}
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={addQuantity}
          textAlign="center"
          onChange={(event) => setAddQuantity(event.target.value)}
        />
        <Button size="sm" onClick={add} disabled={!canAdd}>
          넣기
        </Button>
      </Row>
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
    <AutoGrid min="md" alignItems="start">
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
    </AutoGrid>
  );
}
