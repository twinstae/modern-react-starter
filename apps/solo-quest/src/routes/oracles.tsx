import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { styled } from "styled-system/jsx";
import { button } from "styled-system/recipes";

import { OracleManager } from "../components/oracle-manager.tsx";
import type { Oracle } from "../domain/oracle.ts";
import { removeOracle, saveOracle } from "../oracle-actions.ts";
import { oracleQueries } from "../queries.ts";

export const Route = createFileRoute("/oracles")({
  // 이미 불러온 데이터가 있으면 loader가 막지 않는다. 신선도는 useSuspenseQuery의 기본 동작이 맡는다.
  loader: ({ context }) =>
    context.queryClient.query({ ...oracleQueries.list(), staleTime: "static" }),
  component: OraclesPage,
});

const Main = styled("main", {
  base: {
    maxWidth: "5xl",
    mx: "auto",
    px: "4",
    py: "6",
    display: "flex",
    flexDirection: "column",
    gap: "4",
  },
});

const Header = styled("div", {
  base: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: "3" },
});

const Title = styled("h1", { base: { textStyle: "xl", fontWeight: "semibold" } });

function OraclesPage() {
  const queryClient = useQueryClient();
  const { data: oracles } = useSuspenseQuery(oracleQueries.list());

  const refresh = () => queryClient.invalidateQueries({ queryKey: oracleQueries.list().queryKey });

  // 저장이 성공하면 목록을 다시 읽어 왼쪽 사이드바와 상세가 같은 값을 보게 한다.
  const save = async (oracle: Oracle) => {
    const message = await saveOracle(oracle);
    if (!message) await refresh();
    return message;
  };

  const remove = async (oracleId: string) => {
    const message = await removeOracle(oracleId);
    if (!message) await refresh();
    return message;
  };

  return (
    <Main>
      <Header>
        <Title>오라클 관리</Title>
        <Link to="/" className={button({ variant: "subtle", size: "sm" })} aria-label="홈으로">
          홈으로
        </Link>
      </Header>
      <OracleManager oracles={oracles} onSave={save} onRemove={remove} />
    </Main>
  );
}
