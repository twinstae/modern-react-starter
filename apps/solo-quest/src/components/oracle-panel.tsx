import { Button, Input, Popover, Select } from "@repo/ui";
import { ChevronDown, Dices, Pencil, Plus, Star, StarOff, Trash2 } from "lucide-react";
import { useState } from "react";
import { styled } from "styled-system/jsx";

import type { Oracle } from "../domain/oracle.ts";
import {
  activeCharacters,
  DEFAULT_SPEAKER,
  type Character,
  type OracleMacro,
  type Side,
} from "../domain/session.ts";
import { OracleEditor } from "./oracle-editor.tsx";
import { SIDE_LABEL } from "./side-label.ts";

/** 오라클 패널에서 굴릴 때 넘기는 값. 패널에서 고른 편과 화자로 기록된다. */
export interface OracleRoll {
  side: Side;
  /** 화자 캐릭터 id */
  as: string;
  oracleId: string;
}

const SearchField = styled("div", { base: { width: "full" } });

const PickerRow = styled("div", { base: { display: "flex", gap: "2" } });

const PickerField = styled("div", { base: { width: "32" } });

const List = styled("ul", {
  base: { display: "flex", flexDirection: "column", gap: "1", listStyle: "none", p: "0" },
});

const Row = styled("li", {
  base: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "2",
  },
});

const Dice = styled("span", { base: { ml: "2", fontSize: "xs", color: "fg.subtle" } });

const Registered = styled("span", {
  base: { ml: "2", fontSize: "xs", color: "fg.subtle" },
});

const Description = styled("p", { base: { fontSize: "xs", color: "fg.subtle" } });

const Actions = styled("div", { base: { display: "flex", gap: "0.5" } });

const Footer = styled("div", { base: { mt: "3" } });

const ErrorText = styled("p", { base: { fontSize: "sm", color: "error" } });

const Empty = styled("p", { base: { fontSize: "sm", color: "fg.subtle" } });

interface Item {
  label: string;
  value: string;
}

/** 편이나 화자를 고르는 작은 Select. 패널 안에서 굴릴 때 쓴다. */
function Picker({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: Item[];
  onChange: (value: string) => void;
}) {
  const collection = Select.createListCollection({ items });
  return (
    <Select.Root
      collection={collection}
      value={[value]}
      onValueChange={(details) => onChange(details.value[0] ?? value)}
      size="sm"
    >
      <Select.Label>{label}</Select.Label>
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText />
          <Select.ChevronIndicator />
        </Select.Trigger>
      </Select.Control>
      <Select.Portal>
        <Select.Positioner>
          <Select.Content>
            {items.map((item) => (
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
  );
}

/**
 * 전역 오라클을 보고, 찾고, 고치고, 굴리는 패널. 세션 헤더에 있어 어느 세션에서나 쓴다.
 * 자주 쓰는 오라클은 이 세션의 매크로 버튼으로 등록한다. 등록하면 입력창 위에 버튼이 생긴다.
 */
export function OraclePanel({
  oracles,
  macros,
  characters,
  onRoll,
  onAddMacro,
  onRemoveMacro,
  onSave,
  onRemove,
}: {
  oracles: Oracle[];
  /** 이 세션에 등록한 오라클 매크로 */
  macros: OracleMacro[];
  /** 패널에서 굴릴 때 고를 수 있는 편과 화자 */
  characters: Character[];
  onRoll: (values: OracleRoll) => Promise<string | undefined>;
  onAddMacro: (oracleId: string) => Promise<string | undefined>;
  onRemoveMacro: (macroId: string) => Promise<string | undefined>;
  onSave: (oracle: Oracle) => Promise<string | undefined>;
  onRemove: (oracleId: string) => Promise<string | undefined>;
}) {
  const [search, setSearch] = useState("");
  const [side, setSide] = useState<Side>("player");
  const [speakerId, setSpeakerId] = useState(DEFAULT_SPEAKER.player);
  const [error, setError] = useState<string>();
  const [editing, setEditing] = useState<Oracle | "new">();

  const keyword = search.trim().toLowerCase();
  const found = oracles.filter((oracle) => oracle.name.toLowerCase().includes(keyword));
  const speakerItems = activeCharacters(characters).map((character) => ({
    label: character.name,
    value: character.id,
  }));
  const sideItems: Item[] = (["master", "player"] as const).map((value) => ({
    label: SIDE_LABEL[value],
    value,
  }));

  const roll = async (oracleId: string) =>
    setError(await onRoll({ side, as: speakerId, oracleId }));

  const toggleMacro = async (oracle: Oracle) => {
    const macro = macros.find(({ oracleId }) => oracleId === oracle.id);
    setError(macro ? await onRemoveMacro(macro.id) : await onAddMacro(oracle.id));
  };

  return (
    <Popover.Root size="md" positioning={{ placement: "bottom-end" }}>
      <Popover.Trigger asChild>
        <Button variant="plain" size="sm">
          오라클 {oracles.length} <ChevronDown />
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner>
          <Popover.Content>
            <Popover.Title>오라클</Popover.Title>
            <SearchField>
              <Input
                aria-label="오라클 검색"
                placeholder="이름으로 찾기"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </SearchField>
            <PickerRow>
              <PickerField>
                <Picker
                  label="굴릴 편"
                  value={side}
                  items={sideItems}
                  onChange={(v) => setSide(v as Side)}
                />
              </PickerField>
              <PickerField>
                <Picker
                  label="굴릴 화자"
                  value={speakerId}
                  items={speakerItems}
                  onChange={setSpeakerId}
                />
              </PickerField>
            </PickerRow>
            {error && (
              <ErrorText role="alert" aria-label={error}>
                {error}
              </ErrorText>
            )}
            {found.length === 0 ? (
              <Empty role="status" aria-label="오라클 없음">
                찾는 오라클이 없습니다
              </Empty>
            ) : (
              <List aria-label="오라클 목록">
                {found.map((oracle) => {
                  const registered = macros.some(({ oracleId }) => oracleId === oracle.id);
                  return (
                    <Row key={oracle.id} aria-label={oracle.name}>
                      <div>
                        <span>{oracle.name}</span>
                        <Dice>d{oracle.sides}</Dice>
                        {registered && <Registered>매크로</Registered>}
                        {oracle.description && <Description>{oracle.description}</Description>}
                      </div>
                      <Actions>
                        <Button
                          variant="plain"
                          size="xs"
                          aria-label={`${oracle.name} 굴리기`}
                          title={`${oracle.name} 굴리기`}
                          onClick={() => roll(oracle.id)}
                        >
                          <Dices />
                        </Button>
                        <Button
                          variant="plain"
                          size="xs"
                          aria-label={
                            registered ? `${oracle.name} 매크로 해제` : `${oracle.name} 매크로 등록`
                          }
                          title={registered ? "매크로 해제" : "매크로 등록"}
                          onClick={() => toggleMacro(oracle)}
                        >
                          {registered ? <StarOff /> : <Star />}
                        </Button>
                        <Button
                          variant="plain"
                          size="xs"
                          aria-label={`${oracle.name} 편집`}
                          title={`${oracle.name} 편집`}
                          onClick={() => setEditing(oracle)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="plain"
                          size="xs"
                          aria-label={`${oracle.name} 삭제`}
                          title={`${oracle.name} 삭제`}
                          onClick={async () => setError(await onRemove(oracle.id))}
                        >
                          <Trash2 />
                        </Button>
                      </Actions>
                    </Row>
                  );
                })}
              </List>
            )}
            <Footer>
              <Button
                variant="subtle"
                size="sm"
                aria-label="새 오라클"
                onClick={() => setEditing("new")}
              >
                <Plus /> 새 오라클
              </Button>
            </Footer>
          </Popover.Content>
        </Popover.Positioner>
      </Popover.Portal>

      <OracleEditor
        open={editing !== undefined}
        oracle={editing === "new" || editing === undefined ? undefined : editing}
        onClose={() => setEditing(undefined)}
        onSave={async (oracle) => {
          const message = await onSave(oracle);
          if (!message) setEditing(undefined);
          return message;
        }}
      />
    </Popover.Root>
  );
}
