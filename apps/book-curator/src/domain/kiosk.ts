import * as v from "valibot";

import {
  CitationTemplatesSchema,
  DrawerSchema,
  parseQuestionSet,
  QuestionSchema,
  ScoringSchema,
  TextSchema,
  toQuestionSetDto,
  type QuestionSet,
} from "./question-set.ts";

/**
 * 손님 화면에 보내는 질문 세트. 관리자만 보는 `baselines`와 주인만 보는 서랍
 * 표시(`mark`)는 묶음에 넣지 않는다.
 */
export const PublicQuestionSetSchema = v.strictObject({
  drawers: v.pipe(
    v.array(v.omit(DrawerSchema, ["mark"])),
    v.minLength(2),
  ),
  questions: v.pipe(v.array(QuestionSchema), v.minLength(1)),
  scoring: ScoringSchema,
  statementTemplate: TextSchema,
  citationTemplates: CitationTemplatesSchema,
});

export type PublicQuestionSetDto = v.InferOutput<typeof PublicQuestionSetSchema>;

const PreparingSchema = v.strictObject({ status: v.literal("preparing") });

const ReadySchema = v.strictObject({
  status: v.literal("ready"),
  version: v.pipe(v.number(), v.integer(), v.minValue(1)),
  questionSet: PublicQuestionSetSchema,
});

/** 손님 앱이 받는 공개 묶음의 응답 모양. */
export const KioskCurrentSchema = v.variant("status", [PreparingSchema, ReadySchema]);

export type KioskCurrentDto = v.InferOutput<typeof KioskCurrentSchema>;

export interface ReadyKioskBundle {
  readonly status: "ready";
  readonly version: number;
  readonly questionSet: QuestionSet;
}

export type KioskBundle = { readonly status: "preparing" } | ReadyKioskBundle;

/** 공개 버전을 손님 묶음으로 옮긴다. 필요한 필드만 명시적으로 고른다. */
export function toPublicQuestionSetDto(set: QuestionSet): PublicQuestionSetDto {
  const { questions } = toQuestionSetDto(set);

  return {
    drawers: set.drawers.map(({ code, name, order, statement }) => ({
      code,
      name,
      order,
      statement,
    })),
    questions,
    scoring: { type: set.scoring.type },
    statementTemplate: set.statementTemplate,
    citationTemplates: {
      item: set.citationTemplates.item,
      choice: set.citationTemplates.choice,
    },
  };
}

/** 공개 버전이 없으면 "준비 중", 있으면 그 버전의 묶음을 만든다. */
export function toKioskCurrentDto(
  published: { readonly version: number; readonly questionSet: QuestionSet } | null,
): KioskCurrentDto {
  if (published === null) return { status: "preparing" };
  return {
    status: "ready",
    version: published.version,
    questionSet: toPublicQuestionSetDto(published.questionSet),
  };
}

/**
 * 응답 경계에서 묶음을 파싱한다. 공개 묶음에는 `baselines`가 없으므로 손님 쪽
 * 질문 세트의 기준 응답은 빈 배열로 정규화된다.
 */
export function parseKioskCurrent(value: unknown): KioskBundle {
  const dto = v.parse(KioskCurrentSchema, value);
  if (dto.status === "preparing") return { status: "preparing" };
  return {
    status: "ready",
    version: dto.version,
    questionSet: parseQuestionSet(dto.questionSet),
  };
}
