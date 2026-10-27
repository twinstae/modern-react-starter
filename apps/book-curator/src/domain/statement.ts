import * as v from "valibot";

import { attachJosa, isJosaPair, type JosaPair } from "./josa.ts";

/**
 * 상태 문장과 인용 문형. 문형은 아래 상수 하나씩이고, 렌더링은 순수 함수다.
 *
 * 자리표시:
 * - `{nickname}`: 별명 + " 님". 템플릿에 바로 뒤따르는 " 님"은 겹치지 않게 한 번만 쓴다.
 * - `{drawer}`: 서랍 이름 그대로.
 * - `{drawer:이/가}`: 서랍 이름 끝 받침에 맞춘 조사까지.
 * - `{quote}`: 인용 문장(인용 문형에서만).
 *
 * 모르는 자리표시나 조사는 조용히 넘기지 않고 이름 있는 오류로 거부한다.
 */

/** 1순위 서랍의 상태 문장. */
export const STATEMENT_TEMPLATE = "{nickname} 님에겐 지금, {drawer:이/가} 필요해 보여요";

/** 2순위 서랍의 상태 문장. */
export const SECOND_STATEMENT_TEMPLATE = "{drawer:이/가} 함께 보이면 좋겠어요";

/** 권하는 이유에 손님이 그렇다고 답한 문항을 인용하는 문형. */
export const CITATION_TEMPLATE = "‘{quote}’라고 하셨죠";

export const NICKNAME_MAX_LENGTH = 10;

/** 별명이 비었거나 너무 길 때 던지는 이름 있는 오류. */
export class InvalidNicknameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidNicknameError";
  }
}

/** 템플릿에 모르는 자리표시가 있을 때 던지는 이름 있는 오류. */
export class UnknownPlaceholderError extends Error {
  readonly placeholder: string;

  constructor(placeholder: string) {
    super(`모르는 자리표시입니다: ${placeholder}`);
    this.name = "UnknownPlaceholderError";
    this.placeholder = placeholder;
  }
}

/** 템플릿에 모르는 조사 쌍이 있을 때 던지는 이름 있는 오류. */
export class UnknownJosaError extends Error {
  readonly placeholder: string;
  readonly josa: string;

  constructor(placeholder: string, josa: string) {
    super(`모르는 조사입니다: ${josa}`);
    this.name = "UnknownJosaError";
    this.placeholder = placeholder;
    this.josa = josa;
  }
}

/** 자리표시의 괄호가 맞지 않을 때 던지는 이름 있는 오류. */
export class TemplateSyntaxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemplateSyntaxError";
  }
}

/** 별명 스키마. 앞뒤 공백을 지운 뒤 코드 포인트 1~10개만 받는다. */
export const NicknameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.check((nickname) => Array.from(nickname).length >= 1, "별명을 적어 주세요"),
  v.check(
    (nickname) => Array.from(nickname).length <= NICKNAME_MAX_LENGTH,
    `별명은 ${NICKNAME_MAX_LENGTH}자까지 쓸 수 있어요`,
  ),
);

export type Nickname = v.InferOutput<typeof NicknameSchema>;

export function parseNickname(value: unknown): Nickname {
  const parsed = v.safeParse(NicknameSchema, value);
  if (!parsed.success) {
    throw new InvalidNicknameError(`별명은 1~${NICKNAME_MAX_LENGTH}자여야 합니다`);
  }
  return parsed.output;
}

type PlaceholderName = "nickname" | "drawer" | "quote";

type TemplateToken =
  | { readonly type: "text"; readonly value: string }
  | { readonly type: "nickname" }
  | { readonly type: "drawer"; readonly josa: JosaPair | undefined }
  | { readonly type: "quote" };

const isPlaceholder = (name: string, allowed: readonly PlaceholderName[]): boolean =>
  (allowed as readonly string[]).includes(name);

function parsePlaceholder(raw: string, allowed: readonly PlaceholderName[]): TemplateToken {
  if (raw === "drawer" && isPlaceholder("drawer", allowed)) {
    return { type: "drawer", josa: undefined };
  }

  if (raw.startsWith("drawer:")) {
    if (!isPlaceholder("drawer", allowed)) throw new UnknownPlaceholderError(raw);
    const josa = raw.slice("drawer:".length);
    if (!isJosaPair(josa)) throw new UnknownJosaError(raw, josa);
    return { type: "drawer", josa };
  }

  if (raw === "nickname" && isPlaceholder("nickname", allowed)) return { type: "nickname" };
  if (raw === "quote" && isPlaceholder("quote", allowed)) return { type: "quote" };

  throw new UnknownPlaceholderError(raw);
}

function parseTemplate(template: string, allowed: readonly PlaceholderName[]): TemplateToken[] {
  const tokens: TemplateToken[] = [];
  let text = "";
  let index = 0;

  while (index < template.length) {
    const char = template[index];
    if (char === "{") {
      const end = template.indexOf("}", index + 1);
      if (end === -1) throw new TemplateSyntaxError("자리표시의 닫는 괄호가 없습니다");
      const raw = template.slice(index + 1, end);
      if (raw.includes("{")) throw new TemplateSyntaxError("자리표시 안에 여는 괄호가 있습니다");
      if (text.length > 0) {
        tokens.push({ type: "text", value: text });
        text = "";
      }
      tokens.push(parsePlaceholder(raw, allowed));
      index = end + 1;
      continue;
    }

    if (char === "}") throw new TemplateSyntaxError("짝이 없는 닫는 괄호가 있습니다");
    text += char;
    index += 1;
  }

  if (text.length > 0) tokens.push({ type: "text", value: text });
  return tokens;
}

const HONORIFIC_AFTER_NICKNAME = /^[ \t]*님/u;
const HONORIFIC_SUFFIX = /[ \t]*님$/u;

export interface StatementContext {
  readonly drawerName: string;
  readonly nickname: string;
}

/**
 * 상태 문장을 만든다. 별명은 스키마로 파싱해 늘 "이름 님" 꼴로 넣고,
 * 서랍 이름에는 받침에 맞는 조사를 붙인다. 순수 함수다.
 */
export function renderStatement(template: string, context: StatementContext): string {
  const nickname = parseNickname(context.nickname);
  const tokens = parseTemplate(template, ["nickname", "drawer"]);
  let rendered = "";

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === undefined) continue;

    switch (token.type) {
      case "text":
        rendered += token.value;
        break;
      case "nickname": {
        // 손님이 이미 "토끼 님"처럼 님을 붙여 넣어도 한 번만 쓴다.
        rendered += HONORIFIC_SUFFIX.test(nickname) ? nickname : `${nickname} 님`;
        const next = tokens[index + 1];
        if (next?.type === "text") {
          const honorific = HONORIFIC_AFTER_NICKNAME.exec(next.value);
          if (honorific !== null) {
            rendered += next.value.slice(honorific[0].length);
            index += 1;
          }
        }
        break;
      }
      case "drawer":
        rendered +=
          token.josa === undefined
            ? context.drawerName
            : attachJosa(context.drawerName, token.josa);
        break;
      case "quote":
        throw new UnknownPlaceholderError("quote");
    }
  }

  return rendered;
}

/** 인용 문형에 인용 문장을 넣는다. 순수 함수다. */
export function renderCitation(template: string, context: { readonly quote: string }): string {
  const tokens = parseTemplate(template, ["quote"]);
  let rendered = "";

  for (const token of tokens) {
    switch (token.type) {
      case "text":
        rendered += token.value;
        break;
      case "quote":
        rendered += context.quote;
        break;
      case "nickname":
      case "drawer":
        throw new UnknownPlaceholderError(token.type);
    }
  }

  return rendered;
}
