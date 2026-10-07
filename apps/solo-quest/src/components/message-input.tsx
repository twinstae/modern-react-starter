import { SimpleForm, SimpleSelect, SimpleTextarea, SimpleWatch, SubmitButton } from "@repo/ui";
import { SendHorizontal } from "lucide-react";
import { styled } from "styled-system/jsx";
import * as v from "valibot";

import { DEFAULT_SPEAKER, type Character, type Side } from "../domain/session.ts";
import { remainingGraphemes, ShortText } from "../domain/short-text.ts";
import { SIDE_LABEL } from "./side-label.ts";

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

interface MessageInputProps {
  side: Side;
  /** 모든 캐릭터. 화자 목록에는 이 중 활성 캐릭터만 나온다. */
  characters: Character[];
  /** 처음 골라져 있는 화자. 정하지 않으면 편의 기본 화자다. 이후 화자는 폼이 들고 있다. */
  defaultSpeakerId?: string;
  /** 오류 메시지를 돌려주면 입력을 유지하고 보여 준다. 성공하면 undefined를 돌려준다. */
  onSubmit: (values: MessageValues) => Promise<string | undefined>;
}

const Layout = styled("div", { base: { display: "flex", flexDirection: "column", gap: "1.5" } });

/** 화자 선택은 입력창 위에 작게 붙는다. */
const Speaker = styled("div", { base: { width: "40" } });

const Row = styled("div", { base: { display: "flex", gap: "2", alignItems: "flex-start" } });

const Grow = styled("div", { base: { flex: "1", minWidth: "0" } });

const Remaining = styled("p", {
  base: { alignSelf: "flex-end", fontSize: "xs", color: "fg.subtle" },
});

/** 남은 글자 수는 덜 중요한 정보라, 이만큼 남았을 때부터 보인다. */
const SHOW_REMAINING_AT = 20;

export function MessageInput({
  side,
  characters,
  defaultSpeakerId = DEFAULT_SPEAKER[side],
  onSubmit,
}: MessageInputProps) {
  const label = SIDE_LABEL[side];

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
        <Speaker>
          <SimpleSelect
            name="as"
            label={`${label} 화자`}
            hideLabel
            size="sm"
            items={characters
              .filter((character) => !character.archived)
              .map((character) => ({ label: character.name, value: character.id }))}
          />
        </Speaker>
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
