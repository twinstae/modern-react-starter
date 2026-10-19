import { Button, useSimpleField } from "@repo/ui";
import { Dices } from "lucide-react";
import { useState } from "react";
import { styled } from "styled-system/jsx";

import type { Oracle } from "../domain/oracle.ts";
import type { Side } from "../domain/session.ts";

/** 오라클 버튼으로 굴릴 때 넘기는 값. 화자는 입력창에서 고른 캐릭터다. */
export interface OracleRollValues {
  side: Side;
  /** 화자 캐릭터 id */
  as: string;
  oracleId: string;
}

const ErrorText = styled("span", { base: { fontSize: "xs", color: "error" } });

/**
 * 이 세션에 등록한 오라클을 굴리는 버튼. 입력창 폼 안에 있어, 입력창에서 고른 편과 화자로 기록된다.
 * 빈칸이 없어 매크로 버튼과 달리 폼을 띄우지 않고 곧바로 굴린다.
 */
export function OracleButton({
  side,
  oracle,
  onRoll,
}: {
  side: Side;
  oracle: Oracle;
  /** 오류 메시지를 돌려주면 버튼 옆에 보여 준다. */
  onRoll: (values: OracleRollValues) => Promise<string | undefined>;
}) {
  const [speakerId] = useSimpleField("as");
  const [error, setError] = useState<string>();

  return (
    <>
      <Button
        variant="outline"
        size="xs"
        aria-label={`${oracle.name} 굴리기`}
        title={`${oracle.name} (d${oracle.sides})`}
        onClick={async () =>
          setError(await onRoll({ side, as: String(speakerId), oracleId: oracle.id }))
        }
      >
        <Dices /> {oracle.name}
      </Button>
      {error && (
        <ErrorText role="alert" aria-label={error}>
          {error}
        </ErrorText>
      )}
    </>
  );
}
