import {
  Button,
  SimpleForm,
  SimpleSelect,
  SimpleTextarea,
  SimpleWatch,
  SubmitButton,
  useSimpleField,
} from "@repo/ui";
import { useEffect, useRef } from "react";
import { Dices, SendHorizontal } from "lucide-react";
import { styled } from "styled-system/jsx";
import * as v from "valibot";

import type { Oracle } from "../domain/oracle.ts";
import {
  activeCharacters,
  DEFAULT_SPEAKER,
  type Character,
  type Macro,
  type OracleMacro,
  type Side,
} from "../domain/session.ts";
import { remainingGraphemes, ShortText } from "../domain/short-text.ts";
import { MacroButton, type MacroRollValues } from "./macro-button.tsx";
import { OracleButton, type OracleRollValues } from "./oracle-button.tsx";
import { SIDE_LABEL } from "./side-label.ts";

export type { MacroRollValues };

export interface MessageValues {
  side: Side;
  /** 화자 캐릭터 id */
  as: string;
  text: string;
}

const MessageSchema = v.object({
  as: v.pipe(v.string(), v.minLength(1, "화자를 골라주세요")),
  text: ShortText,
});

export interface MessageInputProps {
  side: Side;
  /** 모든 캐릭터. 화자 목록에는 이 중 활성 캐릭터만 나온다. */
  characters: Character[];
  /** 처음 골라져 있는 화자. 정하지 않으면 편의 기본 화자다. 이후 화자는 폼이 들고 있다. */
  defaultSpeakerId?: string;
  /** 오류 메시지를 돌려주면 입력을 유지하고 보여 준다. 성공하면 undefined를 돌려준다. */
  onSubmit: (values: MessageValues) => Promise<string | undefined>;
  /** 등록한 매크로. 화자 옆에 버튼으로 보인다. */
  macros?: Macro[];
  /** 매크로로 굴린다. 오류 메시지를 돌려주면 매크로 폼에 보여 준다. */
  onRollMacro?: (values: MacroRollValues) => Promise<string | undefined>;
  /** 이 세션에 등록한 오라클 버튼. */
  oracleMacros?: OracleMacro[];
  /** 전역 오라클. 등록한 버튼의 이름과 주사위를 읽는다. */
  oracles?: Oracle[];
  /** 오라클을 굴린다. 오류 메시지를 돌려주면 버튼 옆에 보여 준다. */
  onRollOracle?: (values: OracleRollValues) => Promise<string | undefined>;
  /** 저장에 충돌해 버려진 제출의 글. `key`가 바뀔 때마다 입력창에 채워진다. */
  restored?: { key: number; as: string; text: string };
}

const Layout = styled("div", { base: { display: "flex", flexDirection: "column", gap: "1.5" } });

/** 화자 선택과 매크로 버튼은 입력창 위에 한 줄로 작게 붙는다. */
const Toolbar = styled("div", {
  base: { display: "flex", flexWrap: "wrap", gap: "1.5", alignItems: "center" },
});

const Speaker = styled("div", { base: { width: "40" } });

const Row = styled("div", { base: { display: "flex", gap: "2", alignItems: "flex-start" } });

const Grow = styled("div", { base: { flex: "1", minWidth: "0" } });

const Remaining = styled("p", {
  base: { alignSelf: "flex-end", fontSize: "xs", color: "fg.subtle" },
});

/** 남은 글자 수는 덜 중요한 정보라, 이만큼 남았을 때부터 보인다. */
const SHOW_REMAINING_AT = 20;

/**
 * 고른 화자가 더 이상 활성이 아니면(보관되면) 그 편의 기본 캐릭터로 되돌린다.
 * 화자는 폼이 들고 있으므로 폼 안에서 바로잡는다. 쓰던 글은 건드리지 않는다.
 */
function SpeakerFallback({ activeIds, fallback }: { activeIds: string[]; fallback: string }) {
  const [speakerId, setSpeakerId] = useSimpleField("as");
  const stale = !activeIds.includes(String(speakerId));
  useEffect(() => {
    if (stale) setSpeakerId(fallback);
  }, [stale, fallback, setSpeakerId]);
  return null;
}

/** 돌려받은 글과 화자를 폼에 채운다. 입력창에 새로 쓰던 글이 있으면 덮어쓰지 않는다. */
function RestoreInput({ restored }: { restored: NonNullable<MessageInputProps["restored"]> }) {
  const [text, setText] = useSimpleField("text");
  const [, setSpeakerId] = useSimpleField("as");
  // 글이 바뀔 때마다 다시 채우지 않도록 최신 값만 ref로 읽는다
  const typed = useRef(text);
  typed.current = text;
  useEffect(() => {
    if (typed.current) return;
    setText(restored.text);
    setSpeakerId(restored.as);
  }, [restored.key, restored.text, restored.as, setText, setSpeakerId]);
  return null;
}

export function MessageInput({
  side,
  characters,
  defaultSpeakerId = DEFAULT_SPEAKER[side],
  onSubmit,
  macros = [],
  onRollMacro,
  oracleMacros = [],
  oracles = [],
  onRollOracle,
  restored,
}: MessageInputProps) {
  const label = SIDE_LABEL[side];
  const active = activeCharacters(characters);

  return (
    <SimpleForm
      aria-label={`${label} 입력`}
      schema={MessageSchema}
      defaultValues={{ as: defaultSpeakerId, text: "" }}
      // 성공하면 대화만 비우고 화자는 그대로 둔다
      resetOnSuccess={["text"]}
      onSubmit={(values) => onSubmit({ side, ...values })}
    >
      <Layout>
        {restored && <RestoreInput restored={restored} />}
        <Toolbar>
          <Speaker>
            <SimpleSelect
              name="as"
              label={`${label} 화자`}
              hideLabel
              size="sm"
              items={active.map((character) => ({ label: character.name, value: character.id }))}
            />
            <SpeakerFallback
              activeIds={active.map((character) => character.id)}
              fallback={DEFAULT_SPEAKER[side]}
            />
          </Speaker>
          {onRollMacro &&
            macros.map((macro) => (
              <MacroButton key={macro.id} side={side} macro={macro} onRoll={onRollMacro} />
            ))}
          {onRollOracle &&
            oracleMacros.map((macro) => {
              const oracle = oracles.find(({ id }) => id === macro.oracleId);
              // 표가 지워졌으면 굴릴 수 없다. 세션 패널에서 지울 수 있다는 것만 알려 준다.
              if (!oracle) {
                return (
                  <Button
                    key={macro.id}
                    variant="outline"
                    size="xs"
                    disabled
                    aria-label="없는 오라클"
                    title="오라클이 지워졌습니다. 오라클 패널에서 지울 수 있습니다"
                  >
                    <Dices /> 없는 오라클
                  </Button>
                );
              }
              return (
                <OracleButton key={macro.id} side={side} oracle={oracle} onRoll={onRollOracle} />
              );
            })}
        </Toolbar>
        <Row>
          <Grow>
            <SimpleTextarea
              name="text"
              label={`${label} 대화`}
              hideLabel
              submitOnEnter
              rows={2}
              resize="none"
            />
          </Grow>
          {/* Enter로 남기므로 버튼은 보조 수단이라 작고 흐리게 둔다 */}
          <SubmitButton
            variant="subtle"
            aria-label={`${label}로 남기기`}
            title={`${label}로 남기기 (Enter)`}
          >
            <SendHorizontal />
          </SubmitButton>
        </Row>
        <SimpleWatch name="text">
          {(text) => {
            const remaining = remainingGraphemes(String(text));
            if (remaining > SHOW_REMAINING_AT) return null;
            return (
              <Remaining role="status" aria-label={`${label} 남은 글자 수`}>
                {remaining}
              </Remaining>
            );
          }}
        </SimpleWatch>
      </Layout>
    </SimpleForm>
  );
}
