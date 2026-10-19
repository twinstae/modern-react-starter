import { Button, Dialog, Input, Select, Table } from "@repo/ui";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { styled } from "styled-system/jsx";
import { v7 as uuidv7 } from "uuid";

import { parseOracle, type Oracle } from "../domain/oracle.ts";

/** 자주 쓰는 주사위. 표에 따라 다른 면을 고른다. */
const COMMON_SIDES = [100, 20, 10, 6];

const SIDES_ITEMS = COMMON_SIDES.map((sides) => ({ label: `d${sides}`, value: String(sides) }));

interface RowDraft {
  min: string;
  max: string;
  result: string;
}

interface Draft {
  id: string;
  name: string;
  sides: number;
  description: string;
  rows: RowDraft[];
}

const toDraft = (oracle?: Oracle): Draft => ({
  id: oracle?.id ?? `oracle-${uuidv7()}`,
  name: oracle?.name ?? "",
  sides: oracle?.sides ?? 100,
  description: oracle?.description ?? "",
  rows: oracle?.rows.map((row) => ({
    min: String(row.min),
    max: String(row.max),
    result: row.result,
  })) ?? [{ min: "1", max: "100", result: "" }],
});

const Fields = styled("div", {
  base: { display: "flex", flexWrap: "wrap", gap: "3", alignItems: "flex-end" },
});

const NameField = styled("div", { base: { flex: "1", minWidth: "48" } });

const SidesField = styled("div", { base: { width: "24" } });

const DescriptionField = styled("div", { base: { width: "full" } });

/** 표가 100줄일 수 있어 편집하는 표만 스크롤한다. */
const RowsScroll = styled("div", {
  base: { maxHeight: "64", overflowY: "auto", borderWidth: "1px", borderColor: "border" },
});

// Input은 레시피로 만든 컴포넌트라 다시 styled로 감쌀 수 없다. 너비는 감싸는 칸이 정한다.
const NumberCell = styled("div", { base: { width: "24" } });
const ResultCell = styled("div", { base: { width: "full", minWidth: "48" } });

const ErrorText = styled("p", { base: { fontSize: "sm", color: "error" } });

const HINT = "표는 1부터 주사위 면까지 빈틈이나 겹침 없이 덮어야 합니다.";

/**
 * 오라클 표를 고치는 창. 이름, 주사위, 설명과 줄마다 범위와 결과를 적는다.
 * 저장하기 전에 도메인 규칙으로 확인해, 어긴 곳을 바로 알려 준다.
 */
export function OracleEditor({
  open,
  oracle,
  onClose,
  onSave,
}: {
  open: boolean;
  /** 고칠 오라클. 없으면 새로 만든다. */
  oracle?: Oracle;
  onClose: () => void;
  /** 저장한다. 오류 메시지를 돌려주면 창을 연 채 보여 준다. */
  onSave: (oracle: Oracle) => Promise<string | undefined>;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(oracle));
  const [error, setError] = useState<string>();

  // 창을 열 때마다 연 오라클의 값으로 되돌린다. oracle은 목록이 바뀌지 않는 한 같은 값이다.
  useEffect(() => {
    if (!open) return;
    setDraft(toDraft(oracle));
    setError(undefined);
  }, [open, oracle]);

  const sidesItems = SIDES_ITEMS.some((item) => item.value === String(draft.sides))
    ? SIDES_ITEMS
    : [...SIDES_ITEMS, { label: `d${draft.sides}`, value: String(draft.sides) }];
  const collection = Select.createListCollection({ items: sidesItems });

  const setRow = (index: number, next: Partial<RowDraft>) =>
    setDraft({
      ...draft,
      rows: draft.rows.map((row, i) => (i === index ? { ...row, ...next } : row)),
    });

  const addRow = () => {
    const last = draft.rows.at(-1);
    const min = Math.min(Number(last?.max ?? 0) + 1, draft.sides);
    setDraft({
      ...draft,
      rows: [...draft.rows, { min: String(min), max: String(draft.sides), result: "" }],
    });
  };

  const removeRow = (index: number) =>
    setDraft({ ...draft, rows: draft.rows.filter((_, i) => i !== index) });

  const save = async () => {
    const parsed = parseOracle({
      id: draft.id,
      name: draft.name,
      sides: draft.sides,
      ...(draft.description.trim() !== "" && { description: draft.description }),
      rows: draft.rows.map(({ min, max, result }) => ({
        min: Number(min),
        max: Number(max),
        result,
      })),
    });
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setError(await onSave(parsed.oracle));
  };

  return (
    <Dialog.Root open={open} onOpenChange={(details) => !details.open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Title>{oracle ? "오라클 편집" : "새 오라클"}</Dialog.Title>
            <Dialog.Body>
              <Fields>
                <NameField>
                  <label>
                    오라클 이름
                    <Input
                      aria-label="오라클 이름"
                      value={draft.name}
                      onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    />
                  </label>
                </NameField>
                <SidesField>
                  <Select.Root
                    collection={collection}
                    value={[String(draft.sides)]}
                    onValueChange={(details) =>
                      setDraft({ ...draft, sides: Number(details.value[0] ?? draft.sides) })
                    }
                    size="sm"
                  >
                    <Select.Label>주사위</Select.Label>
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText />
                        <Select.ChevronIndicator />
                      </Select.Trigger>
                    </Select.Control>
                    <Select.Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {sidesItems.map((item) => (
                            <Select.Item key={item.value} item={item}>
                              <Select.ItemText>{item.label}</Select.ItemText>
                              <Select.CheckIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Select.Portal>
                    <Select.HiddenSelect />
                  </Select.Root>
                </SidesField>
                <DescriptionField>
                  <label>
                    설명 (선택)
                    <Input
                      aria-label="오라클 설명"
                      value={draft.description}
                      onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                    />
                  </label>
                </DescriptionField>
              </Fields>
              <RowsScroll>
                <Table.Root aria-label="오라클 표">
                  <Table.Head>
                    <Table.Row>
                      <Table.Header>시작</Table.Header>
                      <Table.Header>끝</Table.Header>
                      <Table.Header>결과</Table.Header>
                      <Table.Header />
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    {draft.rows.map((row, index) => (
                      <Table.Row key={index}>
                        <Table.Cell>
                          <NumberCell>
                            <Input
                              type="number"
                              aria-label={`${index + 1}번째 줄 시작`}
                              value={row.min}
                              onChange={(event) => setRow(index, { min: event.target.value })}
                            />
                          </NumberCell>
                        </Table.Cell>
                        <Table.Cell>
                          <NumberCell>
                            <Input
                              type="number"
                              aria-label={`${index + 1}번째 줄 끝`}
                              value={row.max}
                              onChange={(event) => setRow(index, { max: event.target.value })}
                            />
                          </NumberCell>
                        </Table.Cell>
                        <Table.Cell>
                          <ResultCell>
                            <Input
                              aria-label={`${index + 1}번째 줄 결과`}
                              value={row.result}
                              onChange={(event) => setRow(index, { result: event.target.value })}
                            />
                          </ResultCell>
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            variant="plain"
                            size="xs"
                            aria-label={`${index + 1}번째 줄 삭제`}
                            onClick={() => removeRow(index)}
                          >
                            <Trash2 />
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </RowsScroll>
              <Button variant="surface" size="sm" aria-label="줄 추가" onClick={addRow}>
                <Plus /> 줄 추가
              </Button>
              <p>{HINT}</p>
              {error && (
                <ErrorText role="alert" aria-label={error}>
                  {error}
                </ErrorText>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="plain" onClick={onClose}>
                취소
              </Button>
              <Button onClick={save}>저장</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
