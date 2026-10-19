import { Button, Input } from "@repo/ui";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { styled } from "styled-system/jsx";

import { ORACLE_GROUPS, type Oracle } from "../domain/oracle.ts";
import { OracleForm } from "./oracle-form.tsx";

const Layout = styled("div", {
  base: { display: "grid", gridTemplateColumns: "1fr 4fr", gap: "6", alignItems: "start" },
});

const Sidebar = styled("div", {
  base: { display: "flex", flexDirection: "column", gap: "3", position: "sticky", top: "0" },
});

const Category = styled("h3", {
  base: { mt: "3", fontSize: "sm", fontWeight: "semibold", color: "fg.default" },
});

const Group = styled("h4", {
  base: { mt: "2", fontSize: "xs", fontWeight: "semibold", color: "fg.subtle" },
});

const Tree = styled("ul", {
  base: { display: "flex", flexDirection: "column", gap: "0.5", listStyle: "none", p: "0" },
});

const Item = styled("li", { base: {} });

const Pane = styled("div", { base: { minWidth: "0" } });

const Placeholder = styled("p", { base: { color: "fg.subtle" } });

/** 묶음은 정해 둔 차례(일반, 장소, 인물, 기타)를 먼저, 그 밖은 이름순으로 보여 준다. */
const orderOfGroup = (group: string) => {
  const index = ORACLE_GROUPS.indexOf(group as (typeof ORACLE_GROUPS)[number]);
  return index === -1 ? ORACLE_GROUPS.length : index;
};

/**
 * 오라클 관리 화면. 왼쪽에서 분류와 묶음별로 표를 고르고, 오른쪽 넓은 자리에서 상세를 보고 고친다.
 * 지우는 일은 되돌릴 수 없어 상세에서 한 번 더 확인한다.
 */
export function OracleManager({
  oracles,
  onSave,
  onRemove,
}: {
  oracles: Oracle[];
  onSave: (oracle: Oracle) => Promise<string | undefined>;
  onRemove: (oracleId: string) => Promise<string | undefined>;
}) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const [adding, setAdding] = useState(false);

  // 폼이 다시 그려질 때마다 되돌아가지 않도록, 목록에서 한 번만 추린다.
  const categories = useMemo(
    () =>
      [...new Set(oracles.map((oracle) => oracle.category))].sort((a, b) =>
        a.localeCompare(b, "ko"),
      ),
    [oracles],
  );
  const groups = useMemo(
    () =>
      [...new Set(oracles.map((oracle) => oracle.group))].sort(
        (a, b) => orderOfGroup(a) - orderOfGroup(b) || a.localeCompare(b, "ko"),
      ),
    [oracles],
  );

  const keyword = search.trim().toLowerCase();
  const found = oracles.filter((oracle) => oracle.name.toLowerCase().includes(keyword));
  const tree = categories
    .map((category) => ({
      category,
      groups: groups
        .map((group) => ({
          group,
          oracles: found
            .filter((oracle) => oracle.category === category && oracle.group === group)
            .sort((a, b) => a.name.localeCompare(b.name, "ko")),
        }))
        .filter(({ oracles: list }) => list.length > 0),
    }))
    .filter(({ groups: list }) => list.length > 0);

  const selected = oracles.find(({ id }) => id === selectedId);

  return (
    <Layout>
      <Sidebar>
        <Input
          aria-label="오라클 찾기"
          placeholder="이름으로 찾기"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Button
          variant="subtle"
          size="sm"
          aria-label="새 오라클"
          onClick={() => {
            setAdding(true);
            setSelectedId(undefined);
          }}
        >
          <Plus /> 새 오라클
        </Button>
        <nav aria-label="오라클 분류">
          {tree.map(({ category, groups: groupList }) => (
            <div key={category}>
              <Category>{category}</Category>
              {groupList.map(({ group, oracles: list }) => (
                <div key={group}>
                  <Group>{group}</Group>
                  <Tree>
                    {list.map((oracle) => (
                      <Item key={oracle.id}>
                        <Button
                          variant="plain"
                          size="sm"
                          aria-label={`${oracle.name} 열기`}
                          onClick={() => {
                            setAdding(false);
                            setSelectedId(oracle.id);
                          }}
                        >
                          {oracle.name}
                        </Button>
                      </Item>
                    ))}
                  </Tree>
                </div>
              ))}
            </div>
          ))}
        </nav>
      </Sidebar>
      <Pane>
        {adding || selected ? (
          <OracleForm
            key={adding ? "new" : selected?.id}
            oracle={adding ? undefined : selected}
            categories={categories}
            groups={groups}
            onSave={async (oracle) => {
              const message = await onSave(oracle);
              if (!message) {
                setAdding(false);
                setSelectedId(oracle.id);
              }
              return message;
            }}
            onRemove={onRemove}
            onRemoved={() => setSelectedId(undefined)}
            onCancel={adding ? () => setAdding(false) : undefined}
          />
        ) : (
          <Placeholder>왼쪽에서 오라클을 고르거나 새로 만드세요</Placeholder>
        )}
      </Pane>
    </Layout>
  );
}
