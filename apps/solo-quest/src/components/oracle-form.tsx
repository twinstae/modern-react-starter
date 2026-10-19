import { Button, Dialog, Input, Select, Table, Textarea } from "@repo/ui";
import { ClipboardPaste, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { styled } from "styled-system/jsx";
import { v7 as uuidv7 } from "uuid";

import {
  collapseRanges,
  DEFAULT_CATEGORY,
  DEFAULT_GROUP,
  formatOracleRows,
  ORACLE_KIND_LABEL,
  ORACLE_KINDS,
  parseOracle,
  parseOracleRows,
  rowsByFace,
  type Oracle,
  type OracleKind,
  type OracleRow,
} from "../domain/oracle.ts";

interface RowDraft {
  min: string;
  max: string;
  result: string;
  /** 결과 밑에 보일 짧은 설명. 빈 글자면 없는 것으로 본다. */
  description: string;
  /** 결과에서 건너갈 바깥 주소. 빈 글자면 없는 것으로 본다. */
  url: string;
}

interface Draft {
  id: string;
  name: string;
  category: string;
  group: string;
  sides: number;
  kind: OracleKind;
  description: string;
  rows: RowDraft[];
}

/** 자주 쓰는 주사위. 표에 따라 다른 면을 고른다. */
const COMMON_SIDES = [100, 20, 10, 6];

const toDraftRow = ({ min, max, result, description, url }: OracleRow): RowDraft => ({
  min: String(min),
  max: String(max),
  result,
  description: description ?? "",
  url: url ?? "",
});

/** 적어 둔 곁들임을 저장할 모양으로 읽는다. 빈 칸은 아예 넣지 않는다. */
const extraOf = ({ description, url }: RowDraft) => ({
  ...(description.trim() !== "" && { description }),
  ...(url.trim() !== "" && { url }),
});

const toDraft = (oracle: Oracle | undefined, categories: string[], groups: string[]): Draft => ({
  id: oracle?.id ?? `oracle-${uuidv7()}`,
  name: oracle?.name ?? "",
  category: oracle?.category ?? categories[0] ?? DEFAULT_CATEGORY,
  group: oracle?.group ?? groups[0] ?? DEFAULT_GROUP,
  sides: oracle?.sides ?? 100,
  // 새 오라클은 주사위에 맞춰 1부터 차례대로 칸이 있는 한 칸씩 표로 시작한다.
  kind: oracle?.kind ?? "single",
  description: oracle?.description ?? "",
  rows: oracle ? oracle.rows.map(toDraftRow) : rowsByFace([], 100).map(toDraftRow),
});

/** 지금 적고 있는 줄을 저장할 모양으로 읽는다. 한 칸씩이면 눈마다 하나씩이다. */
const rowsOf = (draft: Draft): OracleRow[] => {
  if (draft.kind === "single") {
    return rowsByFace(
      draft.rows.map((row, index) => ({
        min: index + 1,
        max: index + 1,
        result: row.result,
        ...extraOf(row),
      })),
      draft.sides,
    );
  }
  return draft.rows.map((row) => ({
    min: Number(row.min),
    max: Number(row.max),
    result: row.result,
    ...extraOf(row),
  }));
};

const Fields = styled("div", {
  base: { display: "flex", flexWrap: "wrap", gap: "3", alignItems: "flex-end" },
});

const Grow = styled("div", { base: { flex: "1", minWidth: "48" } });

const Small = styled("div", { base: { width: "28" } });

const Full = styled("div", { base: { width: "full" } });

const RowsScroll = styled("div", {
  base: { maxHeight: "96", overflowY: "auto", borderWidth: "1px", borderColor: "border" },
});

const NumberCell = styled("div", { base: { width: "24" } });

const ResultCell = styled("div", { base: { width: "full", minWidth: "48" } });

const SlotRow = styled("div", {
  base: { display: "flex", alignItems: "center", gap: "2", px: "2", py: "1" },
});

const SlotNumber = styled("span", {
  base: { width: "10", fontSize: "sm", color: "fg.subtle", textAlign: "right" },
});

const Paste = styled("div", { base: { width: "full" } });

const ErrorText = styled("p", { base: { fontSize: "sm", color: "error" } });

const Footer = styled("div", { base: { display: "flex", gap: "2", justifyContent: "flex-end" } });

const HINT = "표는 1부터 주사위 면까지 빈틈이나 겹침 없이 덮어야 합니다.";
const PASTE_HINT =
  '한 줄에 하나씩 붙여넣으세요. 구간은 `53-54, 절벽`, 시작과 끝을 따로 적으면 `53, 54, 절벽`, 한 칸씩은 `절벽` 또는 `53, 절벽`입니다. 결과 뒤에 설명과 링크를 더할 수 있고, 쉼표가 든 칸은 `"`로 감쌉니다. `#`로 시작하는 줄은 건너뜁니다.';

/**
 * 오라클 하나의 상세와 편집 창. 오른쪽에 넓게 두고 쓴다.
 * 분류와 묶음, 주사위와 방식을 고르고, 표를 한 칸씩 또는 구간으로 적는다.
 * 긴 표는 붙여넣기로 채우고, 저장하기 전에 도메인 규칙으로 확인한다.
 */
export function OracleForm({
  oracle,
  categories,
  groups,
  onSave,
  onRemove,
  onRemoved,
  onCancel,
}: {
  /** 고른 오라클. 없으면 새 오라클이다. */
  oracle?: Oracle;
  categories: string[];
  groups: string[];
  onSave: (oracle: Oracle) => Promise<string | undefined>;
  onRemove: (oracleId: string) => Promise<string | undefined>;
  onRemoved: () => void;
  /** 새 오라클을 그만두는 길. 있으면 취소 버튼이 보인다. */
  onCancel?: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(oracle, categories, groups));
  const [error, setError] = useState<string>();
  const [pasteOpen, setPasteOpen] = useState(false);
  const [paste, setPaste] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setDraft(toDraft(oracle, categories, groups));
    setError(undefined);
    setPasteOpen(false);
    setPaste("");
  }, [oracle, categories, groups]);

  const sidesItems = [...new Set([...COMMON_SIDES, draft.sides])].map((sides) => ({
    label: `d${sides}`,
    value: String(sides),
  }));
  const kindItems = ORACLE_KINDS.map((kind) => ({ label: ORACLE_KIND_LABEL[kind], value: kind }));

  const setRow = (index: number, next: Partial<RowDraft>) =>
    setDraft({
      ...draft,
      rows: draft.rows.map((row, i) => (i === index ? { ...row, ...next } : row)),
    });

  /**
   * 방식을 바꾸면 지금까지 적은 결과를 살려 새 모양으로 다시 만든다.
   * 한 칸씩으로 가면 눈마다 펼치고, 구간으로 가면 이웃한 눈이 같은 결과끼리 묶는다.
   */
  const changeKind = (kind: OracleKind) => {
    const faces = rowsByFace(rowsOf(draft), draft.sides);
    setDraft({
      ...draft,
      kind,
      rows: (kind === "single" ? faces : collapseRanges(faces, draft.sides)).map(toDraftRow),
    });
    setError(undefined);
  };

  /** 주사위 면을 바꾸면 한 칸씩 표는 칸 수를 맞추고, 구간 표는 마지막 줄의 끝을 새 면까지 늘린다. */
  const changeSides = (sides: number) => {
    const current = rowsOf(draft);
    setDraft({
      ...draft,
      sides,
      rows: (draft.kind === "single" ? rowsByFace(current, sides) : current).map(toDraftRow),
    });
    setError(undefined);
  };

  const addRow = () => {
    const last = draft.rows.at(-1);
    const min = Math.min(Number(last?.max ?? 0) + 1, draft.sides);
    setDraft({
      ...draft,
      rows: [
        ...draft.rows,
        { min: String(min), max: String(draft.sides), result: "", description: "", url: "" },
      ],
    });
  };

  const removeRow = (index: number) =>
    setDraft({ ...draft, rows: draft.rows.filter((_, i) => i !== index) });

  const applyPaste = () => {
    const parsed = parseOracleRows(draft.kind, draft.sides, paste);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setDraft({ ...draft, rows: parsed.rows.map(toDraftRow) });
    setError(undefined);
    setPasteOpen(false);
  };

  const exportRows = () => {
    setPaste(formatOracleRows(rowsOf(draft), draft.kind));
    setPasteOpen(true);
    setError(undefined);
  };

  const save = async () => {
    if (
      draft.kind === "ranges" &&
      draft.rows.some((row) => !/^\d+$/.test(row.min.trim()) || !/^\d+$/.test(row.max.trim()))
    ) {
      setError("범위의 시작과 끝을 숫자로 적어주세요");
      return;
    }
    const parsed = parseOracle({
      id: draft.id,
      name: draft.name,
      category: draft.category,
      group: draft.group,
      sides: draft.sides,
      kind: draft.kind,
      ...(draft.description.trim() !== "" && { description: draft.description }),
      rows: rowsOf(draft),
    });
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setError(await onSave(parsed.oracle));
  };

  const confirmRemove = async () => {
    const message = await onRemove(draft.id);
    if (message) {
      setError(message);
      return;
    }
    setConfirmOpen(false);
    onRemoved();
  };

  return (
    <section aria-label={oracle ? `${draft.name} 상세` : "새 오라클"}>
      <Fields>
        <Grow>
          <label>
            오라클 이름
            <Input
              aria-label="오라클 이름"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </label>
        </Grow>
        <Small>
          <label>
            분류
            <Input
              aria-label="분류"
              list="oracle-categories"
              value={draft.category}
              onChange={(event) => setDraft({ ...draft, category: event.target.value })}
            />
          </label>
          <datalist id="oracle-categories">
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </Small>
        <Small>
          <label>
            묶음
            <Input
              aria-label="묶음"
              list="oracle-groups"
              value={draft.group}
              onChange={(event) => setDraft({ ...draft, group: event.target.value })}
            />
          </label>
          <datalist id="oracle-groups">
            {groups.map((group) => (
              <option key={group} value={group} />
            ))}
          </datalist>
        </Small>
        <Small>
          <Select.Root
            collection={Select.createListCollection({ items: sidesItems })}
            value={[String(draft.sides)]}
            onValueChange={(details) => changeSides(Number(details.value[0] ?? draft.sides))}
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
        </Small>
        <Small>
          <Select.Root
            collection={Select.createListCollection({ items: kindItems })}
            value={[draft.kind]}
            onValueChange={(details) => changeKind((details.value[0] ?? draft.kind) as OracleKind)}
            size="sm"
          >
            <Select.Label>방식</Select.Label>
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText />
                <Select.ChevronIndicator />
              </Select.Trigger>
            </Select.Control>
            <Select.Portal>
              <Select.Positioner>
                <Select.Content>
                  {kindItems.map((item) => (
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
        </Small>
        <Full>
          <label>
            설명 (선택)
            <Input
              aria-label="오라클 설명"
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </label>
        </Full>
      </Fields>

      {pasteOpen && (
        <Paste>
          <Textarea
            aria-label="표 붙여넣기"
            rows={6}
            placeholder={PASTE_HINT}
            value={paste}
            onChange={(event) => setPaste(event.target.value)}
          />
          <Button variant="surface" size="sm" aria-label="붙여넣기 적용" onClick={applyPaste}>
            <Upload /> 적용
          </Button>
          <Button variant="plain" size="sm" onClick={() => setPasteOpen(false)}>
            닫기
          </Button>
        </Paste>
      )}

      {draft.kind === "single" ? (
        <RowsScroll>
          {draft.rows.map((row, index) => (
            <SlotRow key={index}>
              <SlotNumber>{index + 1}</SlotNumber>
              <Input
                aria-label={`${index + 1}번 칸`}
                value={row.result}
                onChange={(event) => setRow(index, { result: event.target.value })}
              />
              <Input
                aria-label={`${index + 1}번 칸 설명`}
                placeholder="설명 (선택)"
                value={row.description}
                onChange={(event) => setRow(index, { description: event.target.value })}
              />
              <Input
                aria-label={`${index + 1}번 칸 링크`}
                placeholder="링크 (선택)"
                value={row.url}
                onChange={(event) => setRow(index, { url: event.target.value })}
              />
            </SlotRow>
          ))}
        </RowsScroll>
      ) : (
        <>
          <RowsScroll>
            <Table.Root aria-label="오라클 표">
              <Table.Head>
                <Table.Row>
                  <Table.Header>시작</Table.Header>
                  <Table.Header>끝</Table.Header>
                  <Table.Header>결과</Table.Header>
                  <Table.Header>설명</Table.Header>
                  <Table.Header>링크</Table.Header>
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
                      <ResultCell>
                        <Input
                          aria-label={`${index + 1}번째 줄 설명`}
                          value={row.description}
                          onChange={(event) => setRow(index, { description: event.target.value })}
                        />
                      </ResultCell>
                    </Table.Cell>
                    <Table.Cell>
                      <ResultCell>
                        <Input
                          aria-label={`${index + 1}번째 줄 링크`}
                          value={row.url}
                          onChange={(event) => setRow(index, { url: event.target.value })}
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
        </>
      )}

      <Button
        variant="plain"
        size="sm"
        aria-label="표 붙여넣기 열기"
        onClick={() => setPasteOpen(true)}
      >
        <ClipboardPaste /> 붙여넣기
      </Button>
      <Button variant="plain" size="sm" aria-label="표 내보내기" onClick={exportRows}>
        <RotateCcw /> 내보내기
      </Button>
      <p>{HINT}</p>
      {error && (
        <ErrorText role="alert" aria-label={error}>
          {error}
        </ErrorText>
      )}

      <Footer>
        {onCancel && (
          <Button variant="plain" onClick={onCancel}>
            취소
          </Button>
        )}
        {oracle && (
          <Button
            variant="subtle"
            colorPalette="red"
            aria-label="오라클 삭제"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 /> 삭제
          </Button>
        )}
        <Button onClick={save}>저장</Button>
      </Footer>

      <Dialog.Root open={confirmOpen} onOpenChange={(details) => setConfirmOpen(details.open)}>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Title>오라클 삭제</Dialog.Title>
              <Dialog.Body>{draft.name}을(를) 지웁니다. 되돌릴 수 없습니다.</Dialog.Body>
              <Dialog.Footer>
                <Button variant="plain" onClick={() => setConfirmOpen(false)}>
                  취소
                </Button>
                <Button
                  variant="subtle"
                  colorPalette="red"
                  aria-label="삭제 확인"
                  onClick={confirmRemove}
                >
                  삭제
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
